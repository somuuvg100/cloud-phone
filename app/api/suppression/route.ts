import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCsrfOrigin, sanitizePhoneNumber } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logSecurityEvent } from "@/lib/audit-logger";
import {
  getUserSuppressionList,
  addToSuppressionList,
  removeFromSuppressionList,
} from "@/services/database";
import { SuppressionReasonType } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || "usr_reachout_demo_9921";
    const { data, error } = await getUserSuppressionList(userId);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch suppression list" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrf = validateCsrfOrigin(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: csrf.reason }, { status: 403 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || "usr_reachout_demo_9921";
    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";

    const rateLimit = checkRateLimit(`sup_add:${userId}`, 10, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many suppression updates. Please wait." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.phone) {
      return NextResponse.json(
        { error: "Phone number is required to add to suppression list" },
        { status: 400 }
      );
    }

    const cleanPhone = sanitizePhoneNumber(body.phone);
    const reason: SuppressionReasonType = body.reason || "user_opt_out";

    const { data, error } = await addToSuppressionList(
      cleanPhone,
      reason,
      userId,
      "user_dashboard_manual"
    );

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    await logSecurityEvent({
      userId,
      eventType: "SUPPRESSION_ADDED",
      severity: "info",
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
      details: { phone: cleanPhone, reason },
    });

    return NextResponse.json(
      { success: true, item: data, message: "Recipient successfully added to suppression list." },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to add suppression entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const csrf = validateCsrfOrigin(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: csrf.reason }, { status: 403 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || "usr_reachout_demo_9921";
    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";

    const body = await request.json().catch(() => null);
    if (!body || !body.phone) {
      return NextResponse.json(
        { error: "Phone number is required to remove from suppression list" },
        { status: 400 }
      );
    }

    const cleanPhone = sanitizePhoneNumber(body.phone);
    const { data: removed, error } = await removeFromSuppressionList(cleanPhone, userId);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    await logSecurityEvent({
      userId,
      eventType: "SUPPRESSION_REMOVED",
      severity: "info",
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
      details: { phone: cleanPhone },
    });

    return NextResponse.json(
      { success: true, message: "Recipient removed from suppression list." },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to remove suppression entry" },
      { status: 500 }
    );
  }
}

