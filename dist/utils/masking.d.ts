import type { IdentityInput } from "../types.js";
/**
 * Masks sensitive PII for audit logging and diagnostics.
 */
export declare function maskGhanaCard(idNumber: string): string;
export declare function maskPhoneNumber(phone?: string): string | undefined;
export declare function maskEmail(email?: string): string | undefined;
export declare function maskIdentityInput(input: IdentityInput): Record<string, unknown>;
