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
export declare const GHANA_CARD_REGEX: RegExp;
/**
 * Validates Ghana Card ID number format.
 */
export declare function isValidGhanaCard(idNumber: string): boolean;
/**
 * Normalizes a Ghana Card number to uppercase with clean hyphens.
 */
export declare function normalizeGhanaCard(idNumber: string): string;
/**
 * Validates ISO 8601 Date of Birth (YYYY-MM-DD) and verifies minimum age (default: 18).
 */
export declare function validateDateOfBirth(dobString: string, minAge?: number): {
    valid: boolean;
    age?: number;
    error?: string;
};
/**
 * Normalizes and sanitizes phone numbers across US (+1), Ghana (+233), and International E.164.
 */
export declare function normalizePhoneNumber(phone?: string): string | undefined;
/**
 * Validates whether a phone number matches standard US / NANP (North American Numbering Plan) format (10 digits).
 */
export declare function validateUsPhoneNumber(phone?: string): {
    valid: boolean;
    normalized?: string;
    error?: string;
};
/**
 * Validates whether a phone number matches standard Ghana mobile network prefixes.
 */
export declare function validateGhanaPhoneNumber(phone?: string): {
    valid: boolean;
    normalized?: string;
    network?: string;
    error?: string;
};
/**
 * Validates document expiry date in ISO 8601 format (YYYY-MM-DD) against current date.
 */
export declare function validateDocumentExpiry(expiryDateString?: string): {
    valid: boolean;
    isExpired?: boolean;
    error?: string;
};
/**
 * Standard GhanaPost GPS Digital Address format: XX-NNN-NNNN or XX-NNNN-NNNN (e.g. AK-039-5028, GA-183-9214).
 */
export declare const GHANAPOST_GPS_REGEX: RegExp;
/**
 * Validates GhanaPost GPS digital address format and identifies region metadata.
 */
export declare function validateGhanaPostGps(digitalAddress?: string): {
    valid: boolean;
    formattedAddress?: string;
    regionName?: string;
    error?: string;
};
