import { NextResponse, type NextRequest } from "next/server";
import twilio from "twilio";
import { createClient } from "@/lib/supabase/server";
import { addToSuppressionList, removeFromSuppressionList } from "@/services/database";
import { sanitizePhoneNumber } from "@/lib/security";
import { logSecurityEvent } from "@/lib/audit-logger";

// Status progression hierarchy to handle out-of-order or duplicate webhook retries safely
const STATUS_HIERARCHY: Record<string, number> = {
  queued: 1,
  sending: 2,
  sent: 3,
  undelivered: 4,
  failed: 4,
  delivered: 5,
};

const STOP_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const START_KEYWORDS = new Set(["START", "UNSTOP", "YES"]);

// Map Twilio status callback strings to standardized ReachOut statuses
function normalizeTwilioStatus(rawStatus: string): string {
  const s = (rawStatus || "").toLowerCase().trim();
  switch (s) {
    case "delivered":
      return "delivered";
    case "sent":
      return "sent";
    case "sending":
      return "sending";
    case "queued":
    case "accepted":
      return "queued";
    case "undelivered":
      return "undelivered";
    case "failed":
      return "failed";
    default:
      return "queued";
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let params: Record<string, string> = {};

    // 1. Parse incoming parameters (Twilio sends application/x-www-form-urlencoded)
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });
    } else {
      const json = await request.json().catch(() => ({}));
      params = json;
    }

    const messageSid = params.MessageSid || params.SmsSid || params.messageSid || "";
    const rawStatus = params.MessageStatus || params.SmsStatus || params.status || "";
    const inboundBody = (params.Body || "").trim().toUpperCase();
    const fromPhone = params.From || "";
    const toPhone = params.To || "";

    // 2. Verify Webhook Authenticity
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioSignature = request.headers.get("x-twilio-signature");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reachout.global";
    const webhookUrl = `${siteUrl}/api/webhooks/twilio`;

    const isLiveTwilioConfigured = Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      authToken &&
      process.env.TWILIO_ACCOUNT_SID.startsWith("AC") &&
      !process.env.TWILIO_ACCOUNT_SID.includes("placeholder")
    );

    // If live Twilio is configured, strictly validate the cryptographic request signature
    if (isLiveTwilioConfigured && authToken) {
      if (!twilioSignature) {
        console.warn("[Twilio Webhook Security] Missing X-Twilio-Signature header.");
        return NextResponse.json(
          { error: "Forbidden: Missing signature header." },
          { status: 403 }
        );
      }

      // Validate signature against webhook URL and parameters
      const isValidSignature = twilio.validateRequest(
        authToken,
        twilioSignature,
        webhookUrl,
        params
      );

      // Also fallback test with full requested URL in case of reverse proxy / ngrok differences
      const isValidWithReqUrl =
        isValidSignature ||
        twilio.validateRequest(authToken, twilioSignature, request.url, params);

      if (!isValidWithReqUrl) {
        console.warn("[Twilio Webhook Security] Cryptographic signature mismatch.");
        await logSecurityEvent({
          eventType: "WEBHOOK_SIGNATURE_MISMATCH",
          severity: "critical",
          ipAddress: request.headers.get("x-forwarded-for"),
          userAgent: request.headers.get("user-agent"),
          details: { messageSid, webhookUrl },
        });

        return NextResponse.json(
          { error: "Forbidden: Invalid webhook signature." },
          { status: 403 }
        );
      }
    }

    const supabase = await createClient();

    // 3. Handle Inbound Opt-Out (STOP / UNSUBSCRIBE) & Opt-In (START) keywords
    if (fromPhone && inboundBody) {
      const cleanPhone = sanitizePhoneNumber(fromPhone);

      if (STOP_KEYWORDS.has(inboundBody)) {
        // Automatic suppression & opt-out update
        await addToSuppressionList(cleanPhone, "stop_keyword", undefined, "carrier_inbound_sms");

        // Mark existing consent records as opted_out
        try {
          await supabase
            .from("consent_records")
            .update({
              consent_status: "opted_out",
              consent_timestamp: new Date().toISOString(),
            })
            .eq("recipient_phone", cleanPhone);
        } catch (dbErr) {
          console.error("Failed to update consent records on STOP:", dbErr);
        }

        await logSecurityEvent({
          eventType: "OPT_OUT_RECEIVED",
          severity: "info",
          ipAddress: request.headers.get("x-forwarded-for"),
          details: { phone: cleanPhone, keyword: inboundBody },
        });

        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been unsubscribed from ReachOut messages. Reply START to resubscribe.</Message></Response>`,
          {
            status: 200,
            headers: { "Content-Type": "text/xml" },
          }
        );
      } else if (START_KEYWORDS.has(inboundBody)) {
        // Remove from suppression & restore opt-in
        await removeFromSuppressionList(cleanPhone);

        try {
          await supabase
            .from("consent_records")
            .update({
              consent_status: "opted_in",
              consent_timestamp: new Date().toISOString(),
            })
            .eq("recipient_phone", cleanPhone);
        } catch (dbErr) {
          console.error("Failed to update consent records on START:", dbErr);
        }

        await logSecurityEvent({
          eventType: "OPT_IN_RESTORED",
          severity: "info",
          ipAddress: request.headers.get("x-forwarded-for"),
          details: { phone: cleanPhone, keyword: inboundBody },
        });

        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been resubscribed to ReachOut messages. Reply STOP to cancel at any time.</Message></Response>`,
          {
            status: 200,
            headers: { "Content-Type": "text/xml" },
          }
        );
      }
    }

    if (!messageSid) {
      return NextResponse.json(
        { received: true, note: "Inbound message processed" },
        { status: 200 }
      );
    }

    // 4. Normalize Status for Delivery Tracking
    const normalizedStatus = normalizeTwilioStatus(rawStatus);

    // 5. Query Database to Match Provider Message ID
    const { data: existingMessage, error: fetchError } = await supabase
      .from("messages")
      .select("id, status, delivered_at, provider_message_id, user_id")
      .eq("provider_message_id", messageSid)
      .maybeSingle();

    if (fetchError) {
      console.error("[Twilio Webhook] Database query error:", fetchError);
      return NextResponse.json(
        { error: "Database error matching message." },
        { status: 500 }
      );
    }

    if (!existingMessage) {
      return NextResponse.json(
        { received: true, note: `No local message record found for SID: ${messageSid}` },
        { status: 200 }
      );
    }

    // 6. Handle Repeated / Out-of-Order Webhook Events Safely
    const currentPriority = STATUS_HIERARCHY[existingMessage.status] || 0;
    const incomingPriority = STATUS_HIERARCHY[normalizedStatus] || 0;

    // RULE: Never regress a higher status to a lower status (e.g. delivered cannot become sent)
    if (currentPriority > incomingPriority) {
      return NextResponse.json(
        {
          received: true,
          ignored: true,
          note: `Ignored status regression from '${existingMessage.status}' to '${normalizedStatus}'`,
        },
        { status: 200 }
      );
    }

    // 7. Record Delivery Timestamp (Never marked delivered unless confirmed by provider)
    const updatePayload: any = {
      status: normalizedStatus,
    };

    if (normalizedStatus === "delivered") {
      updatePayload.delivered_at = new Date().toISOString();
    }

    // 8. Update Database Record
    const { error: updateError } = await supabase
      .from("messages")
      .update(updatePayload)
      .eq("id", existingMessage.id);

    if (updateError) {
      console.error("[Twilio Webhook] Failed to update message:", updateError);
      return NextResponse.json(
        { error: "Failed to persist delivery update." },
        { status: 500 }
      );
    }

    // Log status update audit event
    await logSecurityEvent({
      userId: existingMessage.user_id,
      eventType: `DELIVERY_STATUS_${normalizedStatus.toUpperCase()}`,
      severity: normalizedStatus === "failed" || normalizedStatus === "undelivered" ? "warn" : "info",
      details: {
        messageId: existingMessage.id,
        providerMessageId: messageSid,
        status: normalizedStatus,
      },
    });

    // 9. Return Twilio 200 XML Response
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Status>OK</Status></Response>`,
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (err: any) {
    console.error("[Twilio Webhook Exception]:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
