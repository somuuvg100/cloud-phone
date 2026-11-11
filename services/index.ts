import { CountryInfo, Recipient } from "@/types";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

export const POPULAR_COUNTRIES: CountryInfo[] = [
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸", formatExample: "(555) 123-4567" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧", formatExample: "7911 123456" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦", formatExample: "(555) 234-5678" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪", formatExample: "1512 3456789" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷", formatExample: "6 12 34 56 78" },
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳", formatExample: "98765 43210" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺", formatExample: "412 345 678" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵", formatExample: "90 1234 5678" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬", formatExample: "8123 4567" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪", formatExample: "50 123 4567" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷", formatExample: "(11) 98765-4321" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦", formatExample: "82 123 4567" },
];

export function validatePhoneNumber(rawNumber: string, defaultCountry: any = "US") {
  try {
    const isValid = isValidPhoneNumber(rawNumber, defaultCountry);
    if (!isValid) return { isValid: false, formatted: rawNumber, error: "Invalid number format" };

    const parsed = parsePhoneNumber(rawNumber, defaultCountry);
    return {
      isValid: true,
      formatted: parsed.formatInternational(),
      national: parsed.formatNational(),
      country: parsed.country,
      carrier: "Standard GSM / Telecom",
    };
  } catch (err: any) {
    return { isValid: false, formatted: rawNumber, error: err.message };
  }
}

