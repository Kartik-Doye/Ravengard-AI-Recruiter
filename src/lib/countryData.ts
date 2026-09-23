export interface CountryInfo {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dialCode: string; // e.g. "+91"
  flag: string; // emoji flag e.g. "🇮🇳"
  formatHint: string; // e.g. "98765 43210"
  minDigits: number;
  maxDigits: number;
}

export const COUNTRIES: CountryInfo[] = [
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", formatHint: "(555) 019-2834", minDigits: 10, maxDigits: 10 },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", formatHint: "98765 43210", minDigits: 10, maxDigits: 10 },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", formatHint: "7911 123456", minDigits: 10, maxDigits: 11 },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", formatHint: "(555) 234-5678", minDigits: 10, maxDigits: 10 },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", formatHint: "412 345 678", minDigits: 9, maxDigits: 10 },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", formatHint: "151 23456789", minDigits: 10, maxDigits: 11 },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", formatHint: "6 12 34 56 78", minDigits: 9, maxDigits: 10 },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", formatHint: "8123 4567", minDigits: 8, maxDigits: 8 },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪", formatHint: "50 123 4567", minDigits: 9, maxDigits: 9 },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵", formatHint: "90 1234 5678", minDigits: 10, maxDigits: 11 },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱", formatHint: "6 12345678", minDigits: 9, maxDigits: 9 },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭", formatHint: "79 123 45 67", minDigits: 9, maxDigits: 9 },
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪", formatHint: "70 123 45 67", minDigits: 9, maxDigits: 10 },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪", formatHint: "85 123 4567", minDigits: 9, maxDigits: 9 },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸", formatHint: "612 34 56 78", minDigits: 9, maxDigits: 9 },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹", formatHint: "312 345 6789", minDigits: 9, maxDigits: 10 },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷", formatHint: "11 91234-5678", minDigits: 10, maxDigits: 11 },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦", formatHint: "71 234 5678", minDigits: 9, maxDigits: 9 },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿", formatHint: "21 123 4567", minDigits: 8, maxDigits: 10 },
  { code: "PL", name: "Poland", dialCode: "+48", flag: "🇵🇱", formatHint: "512 345 678", minDigits: 9, maxDigits: 9 },
  { code: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱", formatHint: "50 123 4567", minDigits: 9, maxDigits: 9 },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷", formatHint: "10 1234 5678", minDigits: 9, maxDigits: 10 },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽", formatHint: "55 1234 5678", minDigits: 10, maxDigits: 10 },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬", formatHint: "803 123 4567", minDigits: 10, maxDigits: 10 },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭", formatHint: "917 123 4567", minDigits: 10, maxDigits: 10 },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰", formatHint: "300 1234567", minDigits: 10, maxDigits: 10 },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩", formatHint: "1712 345678", minDigits: 10, maxDigits: 10 },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾", formatHint: "12 345 6789", minDigits: 9, maxDigits: 10 },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩", formatHint: "812 3456 7890", minDigits: 9, maxDigits: 12 },
  { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳", formatHint: "91 234 5678", minDigits: 9, maxDigits: 10 },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬", formatHint: "10 1234 5678", minDigits: 10, maxDigits: 10 },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", formatHint: "50 123 4567", minDigits: 9, maxDigits: 9 },
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷", formatHint: "532 123 4567", minDigits: 10, maxDigits: 10 },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷", formatHint: "11 1234-5678", minDigits: 10, maxDigits: 10 },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱", formatHint: "9 1234 5678", minDigits: 9, maxDigits: 9 },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴", formatHint: "300 123 4567", minDigits: 10, maxDigits: 10 },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹", formatHint: "912 345 678", minDigits: 9, maxDigits: 9 },
  { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪", formatHint: "470 12 34 56", minDigits: 9, maxDigits: 9 },
  { code: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹", formatHint: "664 1234567", minDigits: 9, maxDigits: 11 },
  { code: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰", formatHint: "20 12 34 56", minDigits: 8, maxDigits: 8 },
  { code: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴", formatHint: "412 34 567", minDigits: 8, maxDigits: 8 },
  { code: "FI", name: "Finland", dialCode: "+358", flag: "🇫🇮", formatHint: "40 1234567", minDigits: 7, maxDigits: 10 }
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // US

/**
 * Detect country code from browser locale or timezone
 */
export function detectDefaultCountry(): CountryInfo {
  try {
    // 1. Check navigator.languages or navigator.language (e.g. "en-IN", "fr-FR", "en-GB")
    const languages = typeof navigator !== "undefined" ? (navigator.languages || [navigator.language]) : [];
    for (const lang of languages) {
      if (lang && lang.includes("-")) {
        const region = lang.split("-")[1]?.toUpperCase();
        const match = COUNTRIES.find((c) => c.code === region);
        if (match) return match;
      }
    }

    // 2. Check Intl timezone (e.g. "Asia/Kolkata", "Europe/London", "America/New_York")
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("Kolkata") || tz.includes("Calcutta")) {
        return COUNTRIES.find((c) => c.code === "IN") || DEFAULT_COUNTRY;
      }
      if (tz.includes("London")) {
        return COUNTRIES.find((c) => c.code === "GB") || DEFAULT_COUNTRY;
      }
      if (tz.includes("Toronto") || tz.includes("Vancouver") || tz.includes("Montreal")) {
        return COUNTRIES.find((c) => c.code === "CA") || DEFAULT_COUNTRY;
      }
      if (tz.includes("Sydney") || tz.includes("Melbourne") || tz.includes("Brisbane")) {
        return COUNTRIES.find((c) => c.code === "AU") || DEFAULT_COUNTRY;
      }
      if (tz.includes("Singapore")) {
        return COUNTRIES.find((c) => c.code === "SG") || DEFAULT_COUNTRY;
      }
      if (tz.includes("Berlin") || tz.includes("Frankfurt")) {
        return COUNTRIES.find((c) => c.code === "DE") || DEFAULT_COUNTRY;
      }
      if (tz.includes("Paris")) {
        return COUNTRIES.find((c) => c.code === "FR") || DEFAULT_COUNTRY;
      }
      if (tz.includes("Dubai")) {
        return COUNTRIES.find((c) => c.code === "AE") || DEFAULT_COUNTRY;
      }
      if (tz.includes("Tokyo")) {
        return COUNTRIES.find((c) => c.code === "JP") || DEFAULT_COUNTRY;
      }
    }
  } catch {
    // Fall back to default
  }

  return DEFAULT_COUNTRY;
}

/**
 * Validate national phone number against country constraints
 */
export function validateNationalPhone(
  nationalNumber: string,
  country: CountryInfo
): { valid: boolean; warning?: string; e164?: string } {
  const trimmed = (nationalNumber || "").trim();
  if (!trimmed) {
    return { valid: false, warning: "Mobile number is required" };
  }

  // Strip non-digit characters
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < country.minDigits || digits.length > country.maxDigits) {
    if (country.minDigits === country.maxDigits) {
      return {
        valid: false,
        warning: `Please enter a valid ${country.minDigits}-digit phone number for ${country.name} (e.g. ${country.formatHint})`,
      };
    }
    return {
      valid: false,
      warning: `Phone number for ${country.name} must be between ${country.minDigits} and ${country.maxDigits} digits`,
    };
  }

  // Construct full E.164: [dialCode][digits]
  // If user included a leading 0 (common in UK/Europe), trim it for E.164
  let cleanDigits = digits;
  if (country.code !== "US" && country.code !== "CA" && cleanDigits.startsWith("0")) {
    cleanDigits = cleanDigits.substring(1);
  }

  const e164 = `${country.dialCode}${cleanDigits}`;
  return { valid: true, e164 };
}
