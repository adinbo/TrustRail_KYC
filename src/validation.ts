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
 * Normalizes phone numbers into standard international or local formats.
 */
export function normalizePhoneNumber(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Strip whitespace, hyphens, and parenthesis
  const cleaned = phone.replace(/[\s\-()]/g, "");
  // If local Ghana format 0244xxxxxx, optionally convert or retain standard
  return cleaned;
}
