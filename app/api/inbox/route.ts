import { NextResponse, type NextRequest } from "next/server";
import {
  getConversationThreads,
  getInboxMessages,
  sendReplyMessage,
  simulateIncomingSms,
  markThreadAsRead,
} from "@/services/inbox";
import { validateCsrfOrigin } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const virtualNumberId = searchParams.get("numberId") || undefined;
    const view = searchParams.get("view") || "threads";

    if (view === "messages") {
      const messages = getInboxMessages(virtualNumberId);
      return NextResponse.json({ messages }, { status: 200 });
    }

    const threads = getConversationThreads(virtualNumberId);
    return NextResponse.json({ threads }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to query inbox" },
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

    const body = await request.json().catch(() => null);
    if (!body || !body.action) {
      return NextResponse.json(
        { error: "Missing required action parameter" },
        { status: 400 }
      );
    }

    if (body.action === "reply") {
      if (!body.virtualNumberId || !body.recipientPhone || !body.body) {
        return NextResponse.json(
          { error: "Missing required fields for reply message" },
          { status: 400 }
        );
      }

      const result = sendReplyMessage(
        body.virtualNumberId,
        body.recipientPhone,
        body.body
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json(
        { success: true, message: result.message },
        { status: 201 }
      );
    }

    if (body.action === "simulate") {
      if (!body.virtualNumberId) {
        return NextResponse.json(
          { error: "Please select an active virtual number to receive the test SMS." },
          { status: 400 }
        );
      }

      const incoming = simulateIncomingSms(
        body.virtualNumberId,
        body.serviceName || "whatsapp",
        body.customText
      );

      return NextResponse.json(
        {
          success: true,
          message: incoming,
          notice: `Incoming ${body.serviceName || "SMS"} received!`,
        },
        { status: 201 }
      );
    }

    if (body.action === "mark_read") {
      if (body.contactPhone) {
        markThreadAsRead(body.contactPhone);
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process inbox action" },
      { status: 500 }
    );
  }
}

