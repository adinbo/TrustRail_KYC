export type IdType = "GHANA_CARD" | "PASSPORT" | "DRIVERS_LICENSE" | "VOTERS_ID" | "NIN" | "BVN";

/** Input identity info a partner supplies for verification — mirrors the
 *  fields NIA, Smile ID's Basic/Enhanced & Biometric KYC, and QoreID endpoints. */
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
  /** Supported document type (defaults to GHANA_CARD). */
  idType?: IdType;
  /** Document expiry date in ISO 8601 format (YYYY-MM-DD). */
  expiryDate?: string;
  /** Base64-encoded user selfie image or hosted URL for liveness & face matching. */
  selfieImage?: string;
  /** Base64-encoded front photo of the physical ID document. */
  idCardFrontImage?: string;
  /** Base64-encoded back photo of the physical ID document. */
  idCardBackImage?: string;
  /** Full name (optional shorthand) */
  fullName?: string;
  /** GhanaPost GPS Digital Address (e.g. "AK-039-5028") for Proof of Address. */
  digitalAddress?: string;
  /** Explicit Data Protection Act (Act 843) biometric consent given by citizen */
  consentGiven?: boolean;
  /** ISO timestamp when consent was granted */
  consentTimestamp?: string;
  /** Client IP address for velocity and security auditing */
  ipAddress?: string;
}

export type RiskCategory = "SANCTION" | "PEP" | "ADVERSE_MEDIA" | "CLEAR";

/** Result of a single check (NIA registry, an identity vendor, sanctions, address, expiry). */
export interface IdentityCheckResult {
  source: "nia" | "smile" | "qoreid" | "inhouse" | "mock" | "sanctions" | "address" | "expiry";
  /** true = check passed / no issue found. */
  pass: boolean;
  /** For non-blocking compliance flags (e.g. PEP requiring Enhanced Due Diligence). */
  flaggedForReview?: boolean;
  /** Granular AML / Watchlist category. */
  riskCategory?: RiskCategory;
  /** Free-form reason when pass is false, or extra detail either way. */
  detail?: unknown;
  /** Biometric metrics if facial match / liveness was evaluated. */
  biometrics?: {
    faceMatchScore?: number;
    livenessPassed?: boolean;
    confidenceLevel?: string;
  };
  /** Raw response from the underlying provider, kept for audit — never
   *  logged/displayed by default, just retained. */
  raw?: unknown;
}

/** Combined result across all checks the orchestrator runs. */
export interface IdentityVerificationResult {
  /** true only if every mandatory check that ran passed. */
  verified: boolean;
  /** true if any check flagged the profile for manual / EDD review (e.g. PEP). */
  flaggedForReview?: boolean;
  checks: IdentityCheckResult[];
}

/** Shared contract for the "biometric/registry identity vendor" slot in the
 *  orchestrator — Smile ID and QoreID both satisfy this structurally. */
export interface IdVerificationClient {
  verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
}
