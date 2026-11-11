import { NextResponse, type NextRequest } from "next/server";
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";
import { createClient } from "@/lib/supabase/server";
import { sendTwilioSms } from "@/services/twilio";
import { calculateSmsMetrics } from "@/lib/sms-utils";
import { checkCountryRestrictions } from "@/lib/country-restrictions";
import {
  checkRateLimit,
  checkDuplicateRequest,
  saveIdempotencyResult,
  checkContentSafety,
} from "@/lib/rate-limiter";
import {
  validateCsrfOrigin,
  sanitizeMessageText,
  sanitizePhoneNumber,
  checkRepeatedMessageHarassment,
} from "@/lib/security";
import { checkIsSuppressed } from "@/services/database";
import { logSecurityEvent } from "@/lib/audit-logger";
import { COUNTRIES } from "@/lib/countries";

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // 1. CSRF Origin Protection
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.valid) {
      await logSecurityEvent({
        eventType: "CSRF_ORIGIN_REJECTED",
        severity: "warn",
        ipAddress: clientIp,
        userAgent,
        details: { reason: csrfCheck.reason },
      });

      return NextResponse.json(
        { error: `Forbidden: ${csrfCheck.reason || "Invalid request origin"}` },
        { status: 403 }
      );
    }

    // 2. Authenticate user via Supabase Session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Fallback for demo mode if session not established
    const userId = user?.id || "usr_reachout_demo_9921";
    const isAuthenticated = Boolean(user && !authError);

    // 3. Rate Limiting per user / IP (20 dispatches per minute)
    const rateLimitIdentifier = userId !== "usr_reachout_demo_9921" ? userId : clientIp;
    const rateLimit = checkRateLimit(rateLimitIdentifier, 20, 60);

    if (!rateLimit.allowed) {
      await logSecurityEvent({
        userId,
        eventType: "RATE_LIMIT_EXCEEDED",
        severity: "warn",
        ipAddress: clientIp,
        userAgent,
        details: { retryAfterSeconds: rateLimit.retryAfterSeconds },
      });

      return NextResponse.json(
        {
          error: "Too many message requests. Please wait a moment before sending another SMS.",
          retryAfter: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds || 30),
          },
        }
      );
    }

    // 4. Parse and Validate Request Payload
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON request payload" },
        { status: 400 }
      );
    }

    const {
      recipientPhone,
      messageBody,
      recipientCountry,
      consentConfirmed,
      idempotencyKey,
    } = body;

    // Validate presence of required fields
    if (!recipientPhone || typeof recipientPhone !== "string") {
      return NextResponse.json(
        { error: "Recipient phone number is required" },
        { status: 400 }
      );
    }

    if (!messageBody || typeof messageBody !== "string") {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    // 5. Input Sanitization (strips malicious scripts, zero-width spaces, and control characters)
    const sanitizedBody = sanitizeMessageText(messageBody);
    const sanitizedPhoneInput = sanitizePhoneNumber(recipientPhone);

    if (!sanitizedBody.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty or contain only invalid characters" },
        { status: 400 }
      );
    }

    // 6. Content Safety & Spam Pattern Scanner
    const contentCheck = checkContentSafety(sanitizedBody);
    if (!contentCheck.safe) {
      await logSecurityEvent({
        userId,
        eventType: "CONTENT_SAFETY_BLOCKED",
        severity: "warn",
        ipAddress: clientIp,
        userAgent,
        details: { reason: contentCheck.reason },
      });

      return NextResponse.json(
        { error: contentCheck.reason },
        { status: 400 }
      );
    }

    // 7. Duplicate Request Protection (Idempotency)
    const dedupeKey =
      idempotencyKey ||
      `${userId}:${sanitizedPhoneInput}:${sanitizedBody.substring(0, 40)}`;

    const duplicateCheck = checkDuplicateRequest(dedupeKey);
    if (duplicateCheck.isDuplicate) {
      if (duplicateCheck.cachedResult) {
        return NextResponse.json(duplicateCheck.cachedResult, { status: 200 });
      }
      return NextResponse.json(
        { error: "Duplicate request detected. Please wait before retrying." },
        { status: 409 }
      );
    }

    // 8. Validate & Normalize Phone Number using libphonenumber-js
    const parsedPhone = parsePhoneNumberFromString(sanitizedPhoneInput);
    if (!parsedPhone || !parsedPhone.isValid()) {
      return NextResponse.json(
        {
          error:
            "Invalid recipient phone number. Please enter a valid international mobile number including country dialing code.",
        },
        { status: 400 }
      );
    }

    const e164Number = parsedPhone.format("E.164");
    const countryCode = (parsedPhone.country as CountryCode) || "US";
    const countryMeta = COUNTRIES.find((c) => c.code === countryCode);
    const resolvedCountryName = recipientCountry || countryMeta?.name || countryCode;

    // 9. Abuse Prevention: Check Repeated Message Harassment
    // Max 3 messages to the same destination number per 10 minutes from this user account
    const harassmentCheck = checkRepeatedMessageHarassment(userId, e164Number, 3, 10);
    if (!harassmentCheck.allowed) {
      await logSecurityEvent({
        userId,
        eventType: "HARASSMENT_CAP_TRIGGERED",
        severity: "warn",
        ipAddress: clientIp,
        userAgent,
        details: {
          recipientPhone: e164Number,
          retryAfterSeconds: harassmentCheck.retryAfterSeconds,
        },
      });

      return NextResponse.json(
        {
          error: harassmentCheck.reason,
          retryAfter: harassmentCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 10. Suppression List Check (Opted-Out Recipients & Spam Complaints)
    const isSuppressed = await checkIsSuppressed(e164Number);
    if (isSuppressed) {
      await logSecurityEvent({
        userId,
        eventType: "SUPPRESSION_BLOCKED",
        severity: "warn",
        ipAddress: clientIp,
        userAgent,
        details: { recipientPhone: e164Number },
      });

      return NextResponse.json(
        {
          error:
            "Delivery blocked: This recipient is registered on the suppression list (recipient previously opted out or submitted a STOP request). We cannot dispatch messages to opted-out numbers.",
        },
        { status: 403 }
      );
    }

    // 11. Check Country-Specific SMS Availability & Restrictions
    const countryCheck = checkCountryRestrictions(countryCode, resolvedCountryName);
    if (!countryCheck.allowed) {
      return NextResponse.json(
        { error: countryCheck.reason },
        { status: 403 }
      );
    }

    // 12. Verify Recipient Consent
    if (!consentConfirmed) {
      return NextResponse.json(
        {
          error:
            "Explicit recipient opt-in consent is required under TCPA, GDPR, and global carrier regulations before dispatching messages.",
        },
        { status: 400 }
      );
    }

    // Check existing consent record in Supabase
    if (isAuthenticated) {
      const { data: existingConsent } = await supabase
        .from("consent_records")
        .select("consent_status")
        .eq("user_id", userId)
        .eq("recipient_phone", e164Number)
        .maybeSingle();

      if (
        existingConsent &&
        (existingConsent.consent_status === "opted_out" ||
          existingConsent.consent_status === "revoked")
      ) {
        return NextResponse.json(
          {
            error:
              "Delivery blocked: This recipient has previously opted out of receiving SMS messages from your account.",
          },
          { status: 403 }
        );
      }
    }

    // 13. Check User Messaging Limits (Daily Quota)
    const metrics = calculateSmsMetrics(sanitizedBody);
    let remainingAllowance = 1000 - metrics.segmentCount;

    if (isAuthenticated) {
      const { data: prefs } = await supabase
        .from("messaging_preferences")
        .select("daily_limit, messages_sent_today, last_reset_date")
        .eq("user_id", userId)
        .maybeSingle();

      if (prefs) {
        const isNewDay = new Date(prefs.last_reset_date) < new Date(new Date().toDateString());
        const sentToday = isNewDay ? 0 : prefs.messages_sent_today;

        if (sentToday + metrics.segmentCount > prefs.daily_limit) {
          await logSecurityEvent({
            userId,
            eventType: "QUOTA_EXCEEDED",
            severity: "warn",
            ipAddress: clientIp,
            userAgent,
            details: { sentToday, dailyLimit: prefs.daily_limit },
          });

          return NextResponse.json(
            {
              error: `Daily message allowance exceeded (${sentToday}/${prefs.daily_limit} segments used today). Please upgrade your quota.`,
            },
            { status: 429 }
          );
        }

        remainingAllowance = Math.max(0, prefs.daily_limit - (sentToday + metrics.segmentCount));
      }
    }

    // 14. Send the SMS through Twilio (Zero Client Credential Exposure)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reachout.global";
    const statusCallbackUrl = `${siteUrl}/api/webhooks/twilio`;

    const twilioResult = await sendTwilioSms({
      to: e164Number,
      body: sanitizedBody,
      statusCallbackUrl,
    });

    if (!twilioResult.success) {
      await logSecurityEvent({
        userId,
        eventType: "DISPATCH_FAILED",
        severity: "error",
        ipAddress: clientIp,
        userAgent,
        details: {
          recipientPhone: e164Number,
          error: twilioResult.errorMessage,
          code: twilioResult.errorCode,
        },
      });

      return NextResponse.json(
        {
          error: twilioResult.errorMessage || "Twilio gateway failed to transmit message",
          code: twilioResult.errorCode,
        },
        { status: 502 }
      );
    }

    // 15. Save Message Record & Record Consent in Supabase
    let savedMessageId = `msg_${Date.now()}`;

    if (isAuthenticated) {
      try {
        await supabase
          .from("consent_records")
          .upsert(
            {
              user_id: userId,
              recipient_phone: e164Number,
              consent_status: "opted_in",
              consent_timestamp: new Date().toISOString(),
              consent_source: "api_messages_send",
            },
            { onConflict: "user_id, recipient_phone" }
          );
      } catch (err) {
        console.error("Failed to log consent:", err);
      }

      const { data: dbMessage, error: insertError } = await supabase
        .from("messages")
        .insert({
          user_id: userId,
          recipient_phone: e164Number,
          recipient_country: resolvedCountryName,
          message_body: sanitizedBody,
          provider_message_id: twilioResult.providerMessageId,
          status: twilioResult.status,
          segments: metrics.segmentCount,
          cost_estimate: parseFloat(metrics.estimatedCostUsd),
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!insertError && dbMessage) {
        savedMessageId = dbMessage.id;
      }

      // Safely increment sent counter via RPC or direct update
      try {
        const { error: rpcErr } = await supabase.rpc("increment_message_count", {
          p_user_id: userId,
          p_count: metrics.segmentCount,
        });

        if (rpcErr) {
          await supabase
            .from("messaging_preferences")
            .update({
              messages_sent_today: 1000 - remainingAllowance,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        }
      } catch (rpcCatch) {
        console.error("Allowance increment error:", rpcCatch);
      }
    }

    // 16. Record Audit Log for Successful Message Dispatch
    await logSecurityEvent({
      userId,
      eventType: "SMS_DISPATCHED",
      severity: "info",
      ipAddress: clientIp,
      userAgent,
      details: {
        messageId: savedMessageId,
        providerMessageId: twilioResult.providerMessageId,
        recipientPhone: e164Number,
        country: resolvedCountryName,
        segments: metrics.segmentCount,
        isSimulated: twilioResult.isSimulated || false,
      },
    });

    // 17. Return Response to Frontend
    const responsePayload = {
      success: true,
      messageId: savedMessageId,
      providerMessageId: twilioResult.providerMessageId,
      recipientPhone: e164Number,
      recipientCountry: resolvedCountryName,
      status: twilioResult.status,
      segments: metrics.segmentCount,
      encoding: metrics.encoding,
      costEstimate: parseFloat(metrics.estimatedCostUsd),
      remainingAllowance,
      isSimulated: twilioResult.isSimulated || false,
      warning: countryCheck.warning,
      sentAt: new Date().toISOString(),
    };

    saveIdempotencyResult(dedupeKey, responsePayload);

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: any) {
    console.error("Unhandled error in /api/messages/send:", err);

    await logSecurityEvent({
      eventType: "INTERNAL_DISPATCH_ERROR",
      severity: "error",
      ipAddress: clientIp,
      userAgent,
      details: { error: err.message },
    });

    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while processing your message." },
      { status: 500 }
    );
  }
}
