import { AvailableNumber, VirtualNumber, VirtualNumberType } from "@/types/blacktel";
import { COUNTRIES } from "@/lib/countries";

// Realistic Available International Numbers Catalog
export const AVAILABLE_NUMBERS_CATALOG: AvailableNumber[] = [
  // United States
  {
    phoneNumber: "+1 (415) 890-2314",
    countryCode: "US",
    countryName: "United States",
    countryFlag: "🇺🇸",
    type: "mobile",
    capabilities: ["sms", "voice", "mms", "otp"],
    monthlyPriceCredits: 12,
    setupFeeCredits: 0,
    region: "San Francisco, California",
    bestFor: "SMS & Calls, OTP Verifications",
  },
  {
    phoneNumber: "+1 (212) 658-9041",
    countryCode: "US",
    countryName: "United States",
    countryFlag: "🇺🇸",
    type: "local",
    capabilities: ["sms", "voice"],
    monthlyPriceCredits: 10,
    setupFeeCredits: 0,
    region: "New York City, NY",
    bestFor: "Business Presence, Voice Calls",
  },
  {
    phoneNumber: "+1 (800) 492-0193",
    countryCode: "US",
    countryName: "United States",
    countryFlag: "🇺🇸",
    type: "toll_free",
    capabilities: ["sms", "voice"],
    monthlyPriceCredits: 20,
    setupFeeCredits: 0,
    region: "Toll-Free Nationwide",
    bestFor: "Toll-Free Support Lines",
  },
  {
    phoneNumber: "+1 (310) 902-8812",
    countryCode: "US",
    countryName: "United States",
    countryFlag: "🇺🇸",
    type: "whatsapp_sim",
    capabilities: ["sms", "otp"],
    monthlyPriceCredits: 15,
    setupFeeCredits: 0,
    region: "Los Angeles, CA",
    bestFor: "WhatsApp & Telegram Verification",
  },
  {
    phoneNumber: "+1 (702) 555-0149",
    countryCode: "US",
    countryName: "United States",
    countryFlag: "🇺🇸",
    type: "trash_sim",
    capabilities: ["sms"],
    monthlyPriceCredits: 6,
    setupFeeCredits: 0,
    region: "Disposable 7-Day Line",
    bestFor: "Temporary / Disposable Web Signups",
  },

  // United Kingdom
  {
    phoneNumber: "+44 7911 123456",
    countryCode: "GB",
    countryName: "United Kingdom",
    countryFlag: "🇬🇧",
    type: "mobile",
    capabilities: ["sms", "voice", "otp"],
    monthlyPriceCredits: 14,
    setupFeeCredits: 0,
    region: "London / Mobile Nationwide",
    bestFor: "UK Banking, 2FA & SMS",
  },
  {
    phoneNumber: "+44 20 7946 0912",
    countryCode: "GB",
    countryName: "United Kingdom",
    countryFlag: "🇬🇧",
    type: "local",
    capabilities: ["voice", "sms"],
    monthlyPriceCredits: 12,
    setupFeeCredits: 0,
    region: "Central London",
    bestFor: "London Corporate Office",
  },
  {
    phoneNumber: "+44 7400 982314",
    countryCode: "GB",
    countryName: "United Kingdom",
    countryFlag: "🇬🇧",
    type: "whatsapp_sim",
    capabilities: ["sms", "otp"],
    monthlyPriceCredits: 16,
    setupFeeCredits: 0,
    region: "UK Mobile Virtual SIM",
    bestFor: "WhatsApp Business Account",
  },

  // Germany
  {
    phoneNumber: "+49 1512 3456789",
    countryCode: "DE",
    countryName: "Germany",
    countryFlag: "🇩🇪",
    type: "mobile",
    capabilities: ["sms", "voice", "otp"],
    monthlyPriceCredits: 18,
    setupFeeCredits: 0,
    region: "Berlin / Munich",
    bestFor: "EU Compliance & German OTPs",
  },
  {
    phoneNumber: "+49 30 1234567",
    countryCode: "DE",
    countryName: "Germany",
    countryFlag: "🇩🇪",
    type: "local",
    capabilities: ["voice"],
    monthlyPriceCredits: 15,
    setupFeeCredits: 0,
    region: "Berlin",
    bestFor: "German Landline Voice",
  },

  // Canada
  {
    phoneNumber: "+1 (416) 555-0182",
    countryCode: "CA",
    countryName: "Canada",
    countryFlag: "🇨🇦",
    type: "mobile",
    capabilities: ["sms", "voice", "otp"],
    monthlyPriceCredits: 12,
    setupFeeCredits: 0,
    region: "Toronto, Ontario",
    bestFor: "Canada 2FA & Calls",
  },

  // France
  {
    phoneNumber: "+33 6 12 34 56 78",
    countryCode: "FR",
    countryName: "France",
    countryFlag: "🇫🇷",
    type: "mobile",
    capabilities: ["sms", "voice", "otp"],
    monthlyPriceCredits: 16,
    setupFeeCredits: 0,
    region: "Paris / Mobile",
    bestFor: "French Mobile SMS & OTP",
  },

  // Australia
  {
    phoneNumber: "+61 412 345 678",
    countryCode: "AU",
    countryName: "Australia",
    countryFlag: "🇦🇺",
    type: "mobile",
    capabilities: ["sms", "voice", "otp"],
    monthlyPriceCredits: 18,
    setupFeeCredits: 0,
    region: "Sydney / Melbourne",
    bestFor: "Australian OTP & SMS",
  },

  // Japan
  {
    phoneNumber: "+81 90 1234 5678",
    countryCode: "JP",
    countryName: "Japan",
    countryFlag: "🇯🇵",
    type: "mobile",
    capabilities: ["sms", "voice"],
    monthlyPriceCredits: 25,
    setupFeeCredits: 0,
    region: "Tokyo",
    bestFor: "Japanese Verification & Calls",
  },

  // Brazil
  {
    phoneNumber: "+55 11 98765-4321",
    countryCode: "BR",
    countryName: "Brazil",
    countryFlag: "🇧🇷",
    type: "mobile",
    capabilities: ["sms", "voice", "otp"],
    monthlyPriceCredits: 15,
    setupFeeCredits: 0,
    region: "São Paulo",
    bestFor: "LATAM WhatsApp & SMS",
  },

  // India
  {
    phoneNumber: "+91 98765 43210",
    countryCode: "IN",
    countryName: "India",
    countryFlag: "🇮🇳",
    type: "local",
    capabilities: ["voice", "sms"],
    monthlyPriceCredits: 14,
    setupFeeCredits: 0,
    region: "Mumbai / National",
    bestFor: "India Toll & Customer Route",
  },

  // Netherlands
  {
    phoneNumber: "+31 6 12345678",
    countryCode: "NL",
    countryName: "Netherlands",
    countryFlag: "🇳🇱",
    type: "mobile",
    capabilities: ["sms", "voice", "otp"],
    monthlyPriceCredits: 16,
    setupFeeCredits: 0,
    region: "Amsterdam",
    bestFor: "Benelux 2FA & Messaging",
  },
];

// In-Memory user virtual numbers store (pre-seeded with an active US virtual number)
const userVirtualNumbers: VirtualNumber[] = [
  {
    id: "vn_reachout_us_01",
    userId: "usr_reachout_demo_9921",
    phoneNumber: "+1 (415) 890-2314",
    countryCode: "US",
    countryName: "United States",
    countryFlag: "🇺🇸",
    type: "mobile",
    capabilities: ["sms", "voice", "mms", "otp"],
    status: "active",
    monthlyPriceCredits: 12,
    autoRenew: true,
    forwardToEmail: "sarah@company.com",
    forwardToPhone: "+1 (415) 555-0100",
    autoReplyText: "Thanks for reaching out! We received your text message and will reply shortly.",
    expiresAt: new Date(Date.now() + 28 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "vn_reachout_uk_02",
    userId: "usr_reachout_demo_9921",
    phoneNumber: "+44 7911 123456",
    countryCode: "GB",
    countryName: "United Kingdom",
    countryFlag: "🇬🇧",
    type: "whatsapp_sim",
    capabilities: ["sms", "otp"],
    status: "active",
    monthlyPriceCredits: 16,
    autoRenew: true,
    forwardToEmail: "sarah@company.com",
    forwardToPhone: null,
    autoReplyText: null,
    expiresAt: new Date(Date.now() + 25 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export function getUserVirtualNumbers(userId = "usr_reachout_demo_9921"): VirtualNumber[] {
  return userVirtualNumbers.filter((n) => !n.userId || n.userId === userId);
}

export function rentVirtualNumber(
  phoneNumber: string,
  userId = "usr_reachout_demo_9921"
): { success: boolean; number?: VirtualNumber; error?: string } {
  const catalogItem = AVAILABLE_NUMBERS_CATALOG.find((n) => n.phoneNumber === phoneNumber);
  if (!catalogItem) {
    return { success: false, error: "Requested virtual number is not available in catalog." };
  }

  // Check if user already owns it
  if (userVirtualNumbers.some((n) => n.phoneNumber === phoneNumber && n.status === "active")) {
    return { success: false, error: "You already own this virtual phone number." };
  }

  const newNumber: VirtualNumber = {
    id: `vn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    phoneNumber: catalogItem.phoneNumber,
    countryCode: catalogItem.countryCode,
    countryName: catalogItem.countryName,
    countryFlag: catalogItem.countryFlag,
    type: catalogItem.type,
    capabilities: catalogItem.capabilities,
    status: "active",
    monthlyPriceCredits: catalogItem.monthlyPriceCredits,
    autoRenew: true,
    forwardToEmail: null,
    forwardToPhone: null,
    autoReplyText: null,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  userVirtualNumbers.unshift(newNumber);
  return { success: true, number: newNumber };
}

export function updateVirtualNumberSettings(
  numberId: string,
  settings: {
    autoRenew?: boolean;
    forwardToPhone?: string | null;
    forwardToEmail?: string | null;
    autoReplyText?: string | null;
  }
): { success: boolean; number?: VirtualNumber; error?: string } {
  const num = userVirtualNumbers.find((n) => n.id === numberId);
  if (!num) return { success: false, error: "Virtual number not found." };

  if (settings.autoRenew !== undefined) num.autoRenew = settings.autoRenew;
  if (settings.forwardToPhone !== undefined) num.forwardToPhone = settings.forwardToPhone;
  if (settings.forwardToEmail !== undefined) num.forwardToEmail = settings.forwardToEmail;
  if (settings.autoReplyText !== undefined) num.autoReplyText = settings.autoReplyText;

  return { success: true, number: num };
}

export function cancelVirtualNumber(numberId: string): boolean {
  const idx = userVirtualNumbers.findIndex((n) => n.id === numberId);
  if (idx !== -1) {
    userVirtualNumbers.splice(idx, 1);
    return true;
  }
  return false;
}

