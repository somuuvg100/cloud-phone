import { ConversationThread, InboxMessage } from "@/types/blacktel";
import { getUserVirtualNumbers } from "./virtual-numbers";
import { deductCredits } from "./wallet";

// Helper to extract 4-8 digit OTP codes from text
export function extractOtpCode(text: string): string | undefined {
  if (!text) return undefined;
  // Match patterns like: 123-456, 123456, G-123456, code: 981240
  const match = text.match(/\b(?:\d{4,8}|\d{3}-\d{3}|[A-Z]-\d{4,6})\b/i);
  return match ? match[0] : undefined;
}

// In-memory messages store pre-seeded with realistic incoming verification messages and SMS conversations
let inboxMessages: InboxMessage[] = [
  {
    id: "msg_in_01",
    virtualNumberId: "vn_reachout_us_01",
    direction: "inbound",
    senderPhone: "+1 (833) 491-0982",
    recipientPhone: "+1 (415) 890-2314",
    body: "Your WhatsApp Business verification code is 492-810. Do not share this code with anyone.",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    isOtp: true,
    otpCode: "492-810",
  },
  {
    id: "msg_in_02",
    virtualNumberId: "vn_reachout_us_01",
    direction: "inbound",
    senderPhone: "+1 (650) 253-0000",
    recipientPhone: "+1 (415) 890-2314",
    body: "G-984217 is your Google verification code for two-factor login.",
    isRead: true,
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    isOtp: true,
    otpCode: "G-984217",
  },
  {
    id: "msg_in_03",
    virtualNumberId: "vn_reachout_uk_02",
    direction: "inbound",
    senderPhone: "+44 7700 900123",
    recipientPhone: "+44 7911 123456",
    body: "Hello! Is this the customer support hotline for Global Reach?",
    isRead: true,
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    isOtp: false,
  },
  {
    id: "msg_out_04",
    virtualNumberId: "vn_reachout_uk_02",
    direction: "outbound",
    senderPhone: "+44 7911 123456",
    recipientPhone: "+44 7700 900123",
    body: "Hi there! Yes, you have reached Global Reach Solutions. How can we help you today?",
    isRead: true,
    createdAt: new Date(Date.now() - 110 * 60000).toISOString(),
    isOtp: false,
  },
];

export function getInboxMessages(virtualNumberId?: string): InboxMessage[] {
  let list = inboxMessages;
  if (virtualNumberId && virtualNumberId !== "all") {
    list = list.filter((m) => m.virtualNumberId === virtualNumberId);
  }
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getConversationThreads(virtualNumberId?: string): ConversationThread[] {
  const allMessages = getInboxMessages(virtualNumberId);
  const threadMap = new Map<string, InboxMessage[]>();

  for (const msg of allMessages) {
    const contactKey =
      msg.direction === "inbound" ? msg.senderPhone : msg.recipientPhone;
    if (!threadMap.has(contactKey)) {
      threadMap.set(contactKey, []);
    }
    threadMap.get(contactKey)!.push(msg);
  }

  const threads: ConversationThread[] = [];
  const virtualNumbers = getUserVirtualNumbers();

  threadMap.forEach((msgs, contactPhone) => {
    // Sort chronological ascending
    msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const lastMsg = msgs[msgs.length - 1];
    const unread = msgs.filter((m) => m.direction === "inbound" && !m.isRead).length;

    // Determine flag from contact phone prefix
    let flag = "🌐";
    if (contactPhone.startsWith("+1")) flag = "🇺🇸";
    else if (contactPhone.startsWith("+44")) flag = "🇬🇧";
    else if (contactPhone.startsWith("+49")) flag = "🇩🇪";
    else if (contactPhone.startsWith("+91")) flag = "🇮🇳";

    const vnum = virtualNumbers.find((n) => n.id === lastMsg.virtualNumberId);

    threads.push({
      contactPhone,
      virtualNumberPhone: vnum?.phoneNumber || lastMsg.recipientPhone,
      countryFlag: flag,
      lastMessage: lastMsg.body,
      lastMessageAt: lastMsg.createdAt,
      unreadCount: unread,
      messages: msgs,
    });
  });

  return threads.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export function sendReplyMessage(
  virtualNumberId: string,
  recipientPhone: string,
  body: string
): { success: boolean; message?: InboxMessage; error?: string } {
  // Deduct 1 credit for outbound SMS
  const creditDeduct = deductCredits(
    undefined,
    1,
    "sms_outbound",
    `SMS to ${recipientPhone}`
  );
  if (!creditDeduct.success) {
    return { success: false, error: creditDeduct.error };
  }

  const virtualNumbers = getUserVirtualNumbers();
  const vnum = virtualNumbers.find((n) => n.id === virtualNumberId);
  const senderPhone = vnum?.phoneNumber || "+1 (415) 890-2314";

  const newMsg: InboxMessage = {
    id: `msg_out_${Date.now()}`,
    virtualNumberId,
    direction: "outbound",
    senderPhone,
    recipientPhone,
    body: body.trim(),
    isRead: true,
    createdAt: new Date().toISOString(),
    isOtp: false,
  };

  inboxMessages.push(newMsg);
  return { success: true, message: newMsg };
}

// Simulates an incoming SMS / OTP test from a real service (Telegram, WhatsApp, Bank, etc.)
export function simulateIncomingSms(
  virtualNumberId: string,
  serviceName: "whatsapp" | "google" | "telegram" | "bank" | "uber" | "custom",
  customText?: string
): InboxMessage {
  const virtualNumbers = getUserVirtualNumbers();
  const vnum = virtualNumbers.find((n) => n.id === virtualNumberId);
  const recipientPhone = vnum?.phoneNumber || "+1 (415) 890-2314";

  const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
  let body = customText || "";
  let senderPhone = "+1 (800) 555-0199";

  switch (serviceName) {
    case "whatsapp":
      body = `Your WhatsApp verification code is ${randomCode}. Don't share this code.`;
      senderPhone = "+1 (833) 299-1000";
      break;
    case "google":
      body = `G-${randomCode} is your Google verification code.`;
      senderPhone = "+1 (650) 253-0000";
      break;
    case "telegram":
      body = `Telegram code: ${randomCode}. You can also tap on this link to log in: https://t.me/login/${randomCode}`;
      senderPhone = "+1 (415) 900-2020";
      break;
    case "bank":
      body = `ReachOut Bank Alert: Use one-time passcode ${randomCode} to approve $49.00 payment. Expires in 10 mins.`;
      senderPhone = "+1 (800) 432-1000";
      break;
    case "uber":
      body = `Your Uber code is ${randomCode}. Never share this code. Reply STOP to unsubscribe.`;
      senderPhone = "+1 (415) 992-8237";
      break;
    case "custom":
      body = customText || `Verification code: ${randomCode}`;
      break;
  }

  const incoming: InboxMessage = {
    id: `msg_in_${Date.now()}`,
    virtualNumberId,
    direction: "inbound",
    senderPhone,
    recipientPhone,
    body,
    isRead: false,
    createdAt: new Date().toISOString(),
    isOtp: true,
    otpCode: randomCode,
  };

  inboxMessages.unshift(incoming);
  return incoming;
}

export function markThreadAsRead(contactPhone: string) {
  for (const m of inboxMessages) {
    if (m.senderPhone === contactPhone || m.recipientPhone === contactPhone) {
      m.isRead = true;
    }
  }
}

