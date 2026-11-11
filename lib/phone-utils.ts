import {
  parsePhoneNumberFromString,
  AsYouType,
  CountryCode,
  getExampleNumber,
} from "libphonenumber-js";

export interface PhoneValidationResult {
  isValid: boolean;
  isPossible?: boolean;
  e164: string;
  international: string;
  national: string;
  countryCode: CountryCode;
  dialCode: string;
  error?: string;
}

/**
 * Format phone number as the user types based on the selected country
 */
export function formatAsYouType(rawNumber: string, countryCode: CountryCode): string {
  if (!rawNumber) return "";
  const formatter = new AsYouType(countryCode);
  return formatter.input(rawNumber);
}

/**
 * Validates and normalizes phone number to standard E.164
 */
export function validateAndFormatPhone(
  rawInput: string,
  countryCode: CountryCode,
  dialCode: string
): PhoneValidationResult {
  const digitsOnly = rawInput.replace(/\D/g, "");

  if (!digitsOnly) {
    return {
      isValid: false,
      e164: "",
      international: "",
      national: "",
      countryCode,
      dialCode,
      error: "Phone number is required",
    };
  }

  // Prepend dialCode if user entered national format
  const combined = rawInput.startsWith("+")
    ? rawInput
    : `${dialCode}${digitsOnly}`;

  try {
    const parsed = parsePhoneNumberFromString(combined, countryCode);

    if (!parsed) {
      return {
        isValid: false,
        e164: combined,
        international: combined,
        national: rawInput,
        countryCode,
        dialCode,
        error: "Invalid phone number format",
      };
    }

    const isValid = parsed.isValid();
    const isPossible = parsed.isPossible();

    let error: string | undefined = undefined;
    if (!isValid) {
      if (digitsOnly.length < 5) {
        error = "Phone number is too short";
      } else if (digitsOnly.length > 15) {
        error = "Phone number is too long";
      } else {
        error = `Invalid format for ${countryCode}`;
      }
    }

    return {
      isValid,
      isPossible,
      e164: parsed.format("E.164"),
      international: parsed.formatInternational(),
      national: parsed.formatNational(),
      countryCode: (parsed.country as CountryCode) || countryCode,
      dialCode: `+${parsed.countryCallingCode}`,
      error,
    };
  } catch (err: any) {
    return {
      isValid: false,
      e164: combined,
      international: combined,
      national: rawInput,
      countryCode,
      dialCode,
      error: err.message || "Failed to parse phone number",
    };
  }
}

/**
 * Masks a phone number for privacy display (e.g., +91 98765 •••10)
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  const len = phone.length;
  const start = phone.slice(0, len > 10 ? 6 : 4);
  const end = phone.slice(-2);
  return `${start} •••${end}`;
}

