import twilio from "twilio";

export interface TwilioSendOptions {
  to: string;
  body: string;
  from?: string;
  statusCallbackUrl?: string;
}

export interface TwilioSendResult {
  success: boolean;
  providerMessageId: string;
  status: "queued" | "sent" | "failed";
  price?: string;
  priceUnit?: string;
  errorMessage?: string;
  errorCode?: number;
  isSimulated?: boolean;
}

/**
 * Checks if live Twilio credentials are configured on the server
 */
export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_ACCOUNT_SID.startsWith("AC") &&
    !process.env.TWILIO_ACCOUNT_SID.includes("placeholder")
  );
}

/**
 * Server-side function to send SMS via Twilio API
 * Note: Never call this from client components. Only used in Server Actions or Route Handlers.
 */
export async function sendTwilioSms(options: TwilioSendOptions): Promise<TwilioSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const defaultFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID || "+15005550006";

  // If live credentials are not provided or in testing environment, safely simulate dispatch
  if (!isTwilioConfigured()) {
    console.log("[Twilio Service] Running in sandbox/simulation mode for destination:", options.to);
    
    // Simulate carrier network latency (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockSid = `SM${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    return {
      success: true,
      providerMessageId: mockSid,
      status: "queued",
      price: "-0.0079",
      priceUnit: "USD",
      isSimulated: true,
    };
  }

  try {
    const client = twilio(accountSid, authToken);

    const messageParams: any = {
      to: options.to,
      body: options.body,
    };

    if (defaultFrom.startsWith("MG")) {
      // Messaging Service SID
      messageParams.messagingServiceSid = defaultFrom;
    } else {
      // Direct Phone Number
      messageParams.from = options.from || defaultFrom;
    }

    if (options.statusCallbackUrl) {
      messageParams.statusCallback = options.statusCallbackUrl;
    }

    const message = await client.messages.create(messageParams);

    return {
      success: true,
      providerMessageId: message.sid,
      status: (message.status as any) || "queued",
      price: message.price || "-0.0079",
      priceUnit: message.priceUnit || "USD",
      isSimulated: false,
    };
  } catch (err: any) {
    console.error("[Twilio Gateway Error]:", err);
    return {
      success: false,
      providerMessageId: "",
      status: "failed",
      errorMessage: err.message || "Failed to dispatch SMS via Twilio gateway",
      errorCode: err.code || err.status || 500,
      isSimulated: false,
    };
  }
}

