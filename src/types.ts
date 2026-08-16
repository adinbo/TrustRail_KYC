/** Input identity info a partner supplies for verification — mirrors the
 *  fields NIA, Smile ID's Basic/Enhanced KYC, and QoreID's Ghana Card
 *  endpoint all actually need. */
export interface IdentityInput {
  firstName: string;
  lastName: string;
  /** Ghana Card number (or other supported ID number). */
  idNumber: string;
  /** ISO 8601 date, e.g. "1990-01-01". */
  dateOfBirth: string;
  /** E.164-ish local format is fine; passed through as given. */
  phoneNumber?: string;
  /** Required for Smile ID (their sandbox matches test identities on
   *  last_name + given_names + email together — see smile/client.ts).
   *  Optional field-match input for QoreID. */
  email?: string;
  /** Your own identifier for this end-user — used as Smile's user_id. */
  externalRef: string;
}

/** Result of a single check (NIA registry, an identity vendor, sanctions). */
export interface IdentityCheckResult {
  source: "nia" | "smile" | "qoreid" | "mock" | "sanctions";
  /** true = check passed / no issue found. */
  pass: boolean;
  /** Free-form reason when pass is false, or extra detail either way. */
  detail?: unknown;
  /** Raw response from the underlying provider, kept for audit — never
   *  logged/displayed by default, just retained. */
  raw?: unknown;
}

/** Combined result across all checks the orchestrator runs. */
export interface IdentityVerificationResult {
  /** true only if every check that ran passed. */
  verified: boolean;
  checks: IdentityCheckResult[];
}

/** Shared contract for the "biometric/registry identity vendor" slot in the
 *  orchestrator — Smile ID and QoreID both satisfy this structurally (an
 *  interface has no private fields, so a plain object test double works
 *  too; see test/orchestrator.test.ts). Swapping vendors, or running both
 *  side by side, is a config change, not a redesign. */
export interface IdVerificationClient {
  verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
}
