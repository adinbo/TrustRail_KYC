import type { IdentityInput } from "../types.js";

/**
 * Masks sensitive PII for audit logging and diagnostics.
 */
export function maskGhanaCard(idNumber: string): string {
  if (!idNumber) return "";
  const trimmed = idNumber.trim();
  if (trimmed.length <= 6) return "***";
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-2)}`;
}

export function maskPhoneNumber(phone?: string): string | undefined {
  if (!phone) return undefined;
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return "***";
  return `${trimmed.slice(0, 3)}****${trimmed.slice(-3)}`;
}

export function maskEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const parts = email.split("@");
  const user = parts[0];
  const domain = parts[1];
  if (!user || !domain) return "***";
  const maskedUser = user.length <= 2 ? `${user[0]}*` : `${user[0]}***${user[user.length - 1]}`;
  return `${maskedUser}@${domain}`;
}

export function maskIdentityInput(input: IdentityInput): Record<string, unknown> {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    idNumber: maskGhanaCard(input.idNumber),
    dateOfBirth: input.dateOfBirth ? `${input.dateOfBirth.slice(0, 4)}-**-**` : undefined,
    phoneNumber: maskPhoneNumber(input.phoneNumber),
    email: maskEmail(input.email),
    externalRef: input.externalRef,
  };
}
