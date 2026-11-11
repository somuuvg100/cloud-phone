import { CountryCode } from "libphonenumber-js";

export interface CountryData {
  name: string;
  code: CountryCode;
  dialCode: string;
  flag: string;
  example: string;
  priority?: boolean;
}

export const COUNTRIES: CountryData[] = [
  // Primary Examples specified in Prompt
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳", example: "98765 43210", priority: true },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸", example: "(555) 123-4567", priority: true },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧", example: "7911 123456", priority: true },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦", example: "(555) 234-5678", priority: true },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺", example: "412 345 678", priority: true },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪", example: "1512 3456789", priority: true },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵", example: "90 1234 5678", priority: true },

  // Global Destinations
  { name: "Argentina", code: "AR", dialCode: "+54", flag: "🇦🇷", example: "11 1234-5678" },
  { name: "Austria", code: "AT", dialCode: "+43", flag: "🇦🇹", example: "664 123456" },
  { name: "Belgium", code: "BE", dialCode: "+32", flag: "🇧🇪", example: "470 12 34 56" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷", example: "(11) 98765-4321" },
  { name: "Chile", code: "CL", dialCode: "+56", flag: "🇨🇱", example: "9 1234 5678" },
  { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳", example: "138 0013 8000" },
  { name: "Colombia", code: "CO", dialCode: "+57", flag: "🇨🇴", example: "300 1234567" },
  { name: "Denmark", code: "DK", dialCode: "+45", flag: "🇩🇰", example: "20 12 34 56" },
  { name: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬", example: "100 123 4567" },
  { name: "Finland", code: "FI", dialCode: "+358", flag: "🇫🇮", example: "41 2345678" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷", example: "6 12 34 56 78" },
  { name: "Greece", code: "GR", dialCode: "+30", flag: "🇬🇷", example: "691 234 5678" },
  { name: "Hong Kong", code: "HK", dialCode: "+852", flag: "🇭🇰", example: "5123 4567" },
  { name: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩", example: "812-3456-7890" },
  { name: "Ireland", code: "IE", dialCode: "+353", flag: "🇮🇪", example: "85 123 4567" },
  { name: "Israel", code: "IL", dialCode: "+972", flag: "🇮🇱", example: "50-123-4567" },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹", example: "312 345 6789" },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪", example: "712 345678" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾", example: "12-345 6789" },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽", example: "55 1234 5678" },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱", example: "6 12345678" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿", example: "21 123 4567" },
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬", example: "802 123 4567" },
  { name: "Norway", code: "NO", dialCode: "+47", flag: "🇳🇴", example: "412 34 567" },
  { name: "Pakistan", code: "PK", dialCode: "+92", flag: "🇵🇰", example: "301 2345678" },
  { name: "Philippines", code: "PH", dialCode: "+63", flag: "🇵🇭", example: "917 123 4567" },
  { name: "Poland", code: "PL", dialCode: "+48", flag: "🇵🇱", example: "512 345 678" },
  { name: "Portugal", code: "PT", dialCode: "+351", flag: "🇵🇹", example: "912 345 678" },
  { name: "Qatar", code: "QA", dialCode: "+974", flag: "🇶🇦", example: "3312 3456" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦", example: "50 123 4567" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬", example: "8123 4567" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦", example: "82 123 4567" },
  { name: "South Korea", code: "KR", dialCode: "+82", flag: "🇰🇷", example: "10-1234-5678" },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸", example: "612 34 56 78" },
  { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪", example: "70 123 45 67" },
  { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭", example: "78 123 45 67" },
  { name: "Taiwan", code: "TW", dialCode: "+886", flag: "🇹🇼", example: "912 345 678" },
  { name: "Thailand", code: "TH", dialCode: "+66", flag: "🇹🇭", example: "81 234 5678" },
  { name: "Turkey", code: "TR", dialCode: "+90", flag: "🇹🇷", example: "501 234 56 78" },
  { name: "Ukraine", code: "UA", dialCode: "+380", flag: "🇺🇦", example: "50 123 4567" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪", example: "50 123 4567" },
  { name: "Vietnam", code: "VN", dialCode: "+84", flag: "🇻🇳", example: "91 234 56 78" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // India (+91) or US (+1)

