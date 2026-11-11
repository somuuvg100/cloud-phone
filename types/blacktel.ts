export type VirtualNumberType =
  | "mobile"
  | "local"
  | "toll_free"
  | "whatsapp_sim"
  | "trash_sim";

export type VirtualNumberCapability = "sms" | "voice" | "mms" | "otp";

export interface VirtualNumber {
  id: string;
  userId: string;
  phoneNumber: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  type: VirtualNumberType;
  capabilities: VirtualNumberCapability[];
  status: "active" | "expired" | "renewing" | "suspended";
  monthlyPriceCredits: number;
  autoRenew: boolean;
  forwardToPhone?: string | null;
  forwardToEmail?: string | null;
  autoReplyText?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface AvailableNumber {
  phoneNumber: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  type: VirtualNumberType;
  capabilities: VirtualNumberCapability[];
  monthlyPriceCredits: number;
  setupFeeCredits: number;
  region?: string;
  bestFor: string;
}

export interface WalletBalance {
  credits: number;
  currency: string;
  usdEquivalent: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  amountCredits: number;
  type:
    | "credit_topup"
    | "number_rental"
    | "sms_outbound"
    | "call_outbound"
    | "sms_inbound"
    | "refund";
  description: string;
  referenceId?: string | null;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  credits: number;
  priceUsd: number;
  popular?: boolean;
  bonusCredits?: number;
  description: string;
}

export interface InboxMessage {
  id: string;
  virtualNumberId?: string | null;
  direction: "inbound" | "outbound";
  senderPhone: string;
  recipientPhone: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  isOtp?: boolean;
  otpCode?: string;
}

export interface ConversationThread {
  contactPhone: string;
  virtualNumberPhone: string;
  contactName?: string;
  countryFlag: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: InboxMessage[];
}

export interface CallLogEntry {
  id: string;
  virtualNumberId?: string | null;
  direction: "inbound" | "outbound";
  fromNumber: string;
  toNumber: string;
  durationSeconds: number;
  status: "completed" | "busy" | "no_answer" | "failed" | "canceled";
  recordingUrl?: string | null;
  costCredits: number;
  createdAt: string;
  countryFlag: string;
}

export type WebphoneCallState =
  | "idle"
  | "dialing"
  | "ringing"
  | "connected"
  | "ended"
  | "incoming";

