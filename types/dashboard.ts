export type DeliveryStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "undelivered"
  | "failed"
  | "pending";

export interface ActivityMessage {
  id: string;
  country: {
    name: string;
    code: string;
    flag: string;
    dialCode: string;
  };
  maskedNumber: string;
  fullNumber?: string;
  messagePreview: string;
  timestamp: string;
  status: DeliveryStatus;
  carrier?: string;
  latency?: string;
  segments?: number;
  cost?: string;
}

export interface DashboardStats {
  totalSent: number;
  delivered: number;
  pending: number;
  failed: number;
  dailyAllowance: {
    used: number;
    total: number;
    remaining: number;
  };
}

export interface DailyVolumeData {
  day: string;
  date: string;
  delivered: number;
  pending: number;
  failed: number;
  total: number;
}

export interface CountryVolumeData {
  country: string;
  code: string;
  flag: string;
  count: number;
  percentage: number;
  avgLatency: string;
}

