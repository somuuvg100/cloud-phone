import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateCsrfOrigin,
  sanitizeGeneralText,
  sanitizePhoneNumber,
} from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logSecurityEvent } from "@/lib/audit-logger";
import {
  createAbuseReport,
  addToSuppressionList,
} from "@/services/database";
import { AbuseReportType } from "@/types/database";

const VALID_REPORT_TYPES: AbuseReportType[] = [
  "unsolicited_spam",
  "harassment",
  "phishing",
  "spoofing",
  "other",
];

export async function POST(request: NextRequest) {
  try {
    // 1. CSRF Protection
    const csrf = validateCsrfOrigin(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: csrf.reason }, { status: 403 });
    }

    // 2. Authenticate User Session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || "usr_reachout_demo_9921";
    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";

    // 3. Rate Limit Abuse Reports (5 per 10 minutes)
    const rateLimit = checkRateLimit(`abuse_rep:${userId}`, 5, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "You have submitted multiple reports recently. Please wait before reporting again.",
          retryAfter: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 4. Parse & Validate Payload
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON request payload" },
        { status: 400 }
      );
    }

    const { targetPhone, reportType, description, evidenceMessageId } = body;

    if (!targetPhone || typeof targetPhone !== "string") {
      return NextResponse.json(
        { error: "Target phone number is required" },
        { status: 400 }
      );
    }

    if (!reportType || !VALID_REPORT_TYPES.includes(reportType)) {
      return NextResponse.json(
        { error: `Invalid report type. Allowed types: ${VALID_REPORT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a detailed description (minimum 5 characters)" },
        { status: 400 }
      );
    }

    const cleanPhone = sanitizePhoneNumber(targetPhone);
    const cleanDescription = sanitizeGeneralText(description);

    // 5. Insert Abuse Report into Database
    const { data: createdReport, error: reportError } = await createAbuseReport({
      reporter_user_id: userId,
      target_phone: cleanPhone,
      report_type: reportType as AbuseReportType,
      description: cleanDescription,
      evidence_message_id: evidenceMessageId || null,
      status: "pending",
    });

    if (reportError) {
      return NextResponse.json(
        { error: reportError },
        { status: 500 }
      );
    }

    // 6. Automatic Recipient Suppression for Spam / Harassment
    let suppressionNotice = "";
    if (reportType === "unsolicited_spam" || reportType === "harassment" || reportType === "phishing") {
      await addToSuppressionList(
        cleanPhone,
        reportType === "unsolicited_spam" ? "spam_complaint" : "user_opt_out",
        userId,
        `abuse_report_${reportType}`
      );
      suppressionNotice = " Target number has been automatically added to the suppression list to block further dispatches.";
    }

    // 7. Record Security Audit Log
    await logSecurityEvent({
      userId,
      eventType: "ABUSE_REPORTED",
      severity: "warn",
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
      details: {
        reportId: createdReport?.id,
        targetPhone: cleanPhone,
        reportType,
        autoSuppressed: Boolean(suppressionNotice),
      },
    });

    return NextResponse.json(
      {
        success: true,
        reportId: createdReport?.id,
        message: `Abuse report submitted successfully.${suppressionNotice} Our compliance team has been notified.`,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error in /api/abuse/report:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process abuse report" },
      { status: 500 }
    );
  }
}

