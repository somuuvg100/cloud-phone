import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData().catch(() => null);

    let messageSid = "";
    let messageStatus = "";

    if (formData) {
      messageSid = (formData.get("MessageSid") as string) || "";
      messageStatus = (formData.get("MessageStatus") as string) || "";
    } else {
      const json = await request.json().catch(() => ({}));
      messageSid = json.MessageSid || json.providerMessageId || "";
      messageStatus = json.MessageStatus || json.status || "";
    }

    if (!messageSid) {
      return NextResponse.json({ error: "Missing MessageSid" }, { status: 400 });
    }

    // Normalize Twilio status to ReachOut status
    // Twilio statuses: queued, failed, sent, delivered, undelivered, receiving, received
    let normalizedStatus = "queued";
    if (messageStatus === "delivered") normalizedStatus = "delivered";
    else if (messageStatus === "sent") normalizedStatus = "sent";
    else if (messageStatus === "failed") normalizedStatus = "failed";
    else if (messageStatus === "undelivered") normalizedStatus = "undelivered";

    const supabase = await createClient();

    const updatePayload: any = {
      status: normalizedStatus,
    };

    if (normalizedStatus === "delivered") {
      updatePayload.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("messages")
      .update(updatePayload)
      .eq("provider_message_id", messageSid);

    if (error) {
      console.error("Failed to update message delivery status in Supabase:", error);
    }

    // Return Twilio 200 XML or JSON
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (err: any) {
    console.error("Error processing Twilio webhook:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

