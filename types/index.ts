export type MessageStatus =
  | "draft"
  | "queued"
  | "sending"
  | "delivered"
  | "undelivered"
  | "failed";

export interface CountryInfo {
  name: string;
  code: string; // ISO 2-letter e.g. "US", "GB", "IN"
  dialCode: string; // e.g. "+1", "+44", "+91"
  flag: string; // emoji or svg flag
  formatExample: string;
}

export interface Recipient {
  id: string;
  name?: string;
  phoneNumber: string;
  countryCode: string;
  consentRecorded: boolean;
  consentDate?: string;
  tags?: string[];
}

export interface OutboundMessage {
  id: string;
  recipientPhone: string;
  recipientName?: string;
  content: string;
  countryCode: string;
  status: MessageStatus;
  sentAt: string;
  deliveredAt?: string;
  segments: number;
  carrier?: string;
  costEstimate?: string;
}

export interface PlatformMetric {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

