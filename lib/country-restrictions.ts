import { CountryCode } from "libphonenumber-js";

export interface CountryRestriction {
  countryCode: CountryCode;
  countryName: string;
  isAllowed: boolean;
  requiresRegistration?: boolean;
  notes?: string;
}

// Restricted or Sanctioned destination codes where SMS cannot be dispatched
const SANCTIONED_COUNTRIES: CountryCode[] = [
  "KP", // North Korea
  "SY", // Syria
  "IR", // Iran
  "CU", // Cuba
];

// Special regulatory compliance requirements
const REGULATED_COUNTRIES: Record<string, string> = {
  IN: "India TRAI regulations: Promotional/transactional traffic subjected to DND registry scrubbing and 100% opt-in.",
  US: "US 10DLC compliance: All A2P messaging requires verified brand and campaign registration.",
  SA: "Saudi Arabia CITC regulations: Strict pre-registered alpha sender ID or virtual long-code required.",
  AE: "UAE TDRA: Commercial messaging restricted to daylight hours unless explicit critical alert.",
  CN: "China MIIT: Direct international SMS subject to carrier content keyword filtering.",
};

export function checkCountryRestrictions(
  countryCode: CountryCode,
  countryName: string
): { allowed: boolean; reason?: string; warning?: string } {
  // Check embargoed destinations
  if (SANCTIONED_COUNTRIES.includes(countryCode)) {
    return {
      allowed: false,
      reason: `Telecommunication routes to ${countryName} (${countryCode}) are restricted under international regulatory and sanction compliance.`,
    };
  }

  // Check regional regulatory notes
  const warning = REGULATED_COUNTRIES[countryCode];

  return {
    allowed: true,
    warning,
  };
}

