/**
 * Validation and normalization helpers for identity verification inputs.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Standard Ghana Card format: GHA-XXXXXXXXX-X (where X are digits)
 */
export const GHANA_CARD_REGEX = /^GHA-\d{9}-\d$/i;

/**
 * Validates Ghana Card ID number format.
 */
export function isValidGhanaCard(idNumber: string): boolean {
  if (!idNumber) return false;
  return GHANA_CARD_REGEX.test(idNumber.trim());
}

/**
 * Normalizes a Ghana Card number to uppercase with clean hyphens.
 */
export function normalizeGhanaCard(idNumber: string): string {
  return idNumber.trim().toUpperCase();
}

/**
 * Validates ISO 8601 Date of Birth (YYYY-MM-DD) and verifies minimum age (default: 18).
 */
export function validateDateOfBirth(
  dobString: string,
  minAge = 18,
): { valid: boolean; age?: number; error?: string } {
  if (!dobString || !/^\d{4}-\d{2}-\d{2}$/.test(dobString.trim())) {
    return { valid: false, error: "Date of birth must be in YYYY-MM-DD format." };
  }

  const dob = new Date(dobString.trim());
  if (isNaN(dob.getTime())) {
    return { valid: false, error: "Invalid date of birth." };
  }

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }

  if (age < 0 || age > 130) {
    return { valid: false, error: "Date of birth is out of reasonable range." };
  }

  if (age < minAge) {
    return { valid: false, age, error: `Customer must be at least ${minAge} years old (current age: ${age}).` };
  }

  return { valid: true, age };
}

/**
 * Normalizes and sanitizes phone numbers into standard Ghana local 10-digit format (0XXXXXXXXX).
 * Handles:
 * - "+233 24 123 4567" -> "0241234567"
 * - "+2330241234567"   -> "0241234567"
 * - "233241234567"     -> "0241234567"
 * - "241234567"        -> "0241234567"
 * - "024-123-4567"     -> "0241234567"
 */
export function normalizePhoneNumber(phone?: string): string | undefined {
  if (!phone) return undefined;

  // 1. Remove all spaces, dashes, parentheses, dots, and non-digit characters
  let digits = phone.replace(/[^\d+]/g, "");

  // 2. Strip leading +233 or 233 country code
  if (digits.startsWith("+233")) {
    digits = digits.slice(4);
  } else if (digits.startsWith("233") && digits.length >= 11) {
    digits = digits.slice(3);
  } else if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }

  // 3. Strip any remaining leading zero if followed by 9 digits
  if (digits.startsWith("0") && digits.length === 10) {
    return digits;
  }

  // 4. If 9 digits (e.g. 241234567), prepend 0 to make standard 10 digits
  if (digits.length === 9) {
    return `0${digits}`;
  }

  // 5. If 10 digits starting with 0
  if (digits.length === 10 && digits.startsWith("0")) {
    return digits;
  }

  return digits || undefined;
}

/**
 * Validates whether a phone number matches standard Ghana mobile network prefixes.
 */
export function validateGhanaPhoneNumber(
  phone?: string,
): { valid: boolean; normalized?: string; network?: string; error?: string } {
  if (!phone || !phone.trim()) {
    return { valid: true }; // Optional field
  }

  const normalized = normalizePhoneNumber(phone);
  if (!normalized || !/^0\d{9}$/.test(normalized)) {
    return {
      valid: false,
      error: `Invalid Ghana phone number (${phone}). Expected 9 digits after +233 (e.g., +233 24 123 4567).`,
    };
  }

  const prefix = normalized.slice(0, 3);
  const networkMap: Record<string, string> = {
    "024": "MTN",
    "054": "MTN",
    "055": "MTN",
    "059": "MTN",
    "053": "MTN",
    "020": "Telecel",
    "050": "Telecel",
    "027": "AT (AirtelTigo)",
    "057": "AT (AirtelTigo)",
    "026": "AT (AirtelTigo)",
    "056": "AT (AirtelTigo)",
    "028": "Expresso",
    "023": "Glo",
  };

  const network = networkMap[prefix] || "Ghana Cellular";

  return {
    valid: true,
    normalized,
    network,
  };
}

/**
 * Validates document expiry date in ISO 8601 format (YYYY-MM-DD) against current date.
 */
export function validateDocumentExpiry(
  expiryDateString?: string,
): { valid: boolean; isExpired?: boolean; error?: string } {
  if (!expiryDateString) {
    return { valid: false, error: "Expiry date is required." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDateString.trim())) {
    return { valid: false, error: "Expiry date must be in YYYY-MM-DD format." };
  }

  const expiry = new Date(expiryDateString.trim());
  if (isNaN(expiry.getTime())) {
    return { valid: false, error: "Invalid expiry date." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiry < today) {
    return { valid: false, isExpired: true, error: `Document expired on ${expiryDateString}.` };
  }

  return { valid: true, isExpired: false };
}

/**
 * Standard GhanaPost GPS Digital Address format: XX-NNN-NNNN or XX-NNNN-NNNN (e.g. AK-039-5028, GA-183-9214).
 */
export const GHANAPOST_GPS_REGEX = /^[A-Z]{1,2}-\d{3,4}-\d{4}$/i;

const GHANA_REGION_PREFIXES: Record<string, string> = {
  GA: "Greater Accra (Accra Metropolitan)",
  GS: "Greater Accra (South)",
  GW: "Greater Accra (West)",
  GB: "Greater Accra (Ga South)",
  GE: "Greater Accra (East)",
  GD: "Greater Accra (Dodowa/Adentan)",
  GN: "Greater Accra (North)",
  AK: "Ashanti (Kumasi Metropolitan)",
  AS: "Ashanti (South)",
  AE: "Ashanti (East)",
  AN: "Ashanti (North)",
  AH: "Ashanti",
  CR: "Central (Cape Coast)",
  CC: "Central",
  CP: "Central",
  ER: "Eastern (Koforidua)",
  EN: "Eastern (North)",
  ES: "Eastern (South)",
  WR: "Western (Sekondi-Takoradi)",
  WS: "Western (South)",
  WN: "Western North",
  VR: "Volta (Ho)",
  VE: "Volta (East)",
  VN: "Volta (North / Oti)",
  NR: "Northern (Tamale)",
  NE: "North East",
  NW: "Savannah",
  UE: "Upper East (Bolgatanga)",
  UW: "Upper West (Wa)",
  BA: "Bono (Sunyani)",
  BE: "Bono East (Techiman)",
  BW: "Ahafo (Goaso)",
  BN: "Bono North",
};

/**
 * Validates GhanaPost GPS digital address format and identifies region metadata.
 */
export function validateGhanaPostGps(
  digitalAddress?: string,
): { valid: boolean; formattedAddress?: string; regionName?: string; error?: string } {
  if (!digitalAddress) {
    return { valid: false, error: "Digital address is required." };
  }

  const cleaned = digitalAddress.trim().toUpperCase();
  if (!GHANAPOST_GPS_REGEX.test(cleaned)) {
    return {
      valid: false,
      error: `Invalid GhanaPost GPS format (${cleaned}). Expected format: XX-NNN-NNNN (e.g., AK-039-5028, GA-183-9214)`,
    };
  }

  const prefix = cleaned.split("-")[0] || "";
  const regionName = (prefix ? GHANA_REGION_PREFIXES[prefix] : undefined) || "Ghana Regional District";

  return {
    valid: true,
    formattedAddress: cleaned,
    regionName,
  };
}
