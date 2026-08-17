import type { IdentityOrchestrator } from "../orchestrator.js";
import type { IdentityInput, IdentityVerificationResult } from "../types.js";
import {
  isValidGhanaCard,
  normalizeGhanaCard,
  validateDateOfBirth,
  normalizePhoneNumber,
  validateGhanaPhoneNumber,
} from "../validation.js";
import { maskIdentityInput } from "../utils/masking.js";

export interface CediRampUserKycParams {
  userId: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  phoneNumber?: string;
  email?: string;
  expiryDate?: string;
  digitalAddress?: string;
  selfieImage?: string;
  idCardFrontImage?: string;
}

export interface CediRampKycDecision {
  passed: boolean;
  flaggedForReview?: boolean;
  reason?: string;
  details: {
    validationPassed: boolean;
    verificationResult?: IdentityVerificationResult;
    maskedAudit: Record<string, unknown>;
  };
}

/**
 * Translates individual check failures into clear, actionable human-readable explanations.
 */
export function formatFailureDiagnostics(result: IdentityVerificationResult): string[] {
  const diagnostics: string[] = [];

  for (const check of result.checks) {
    if (check.pass) continue;

    switch (check.source) {
      case "expiry":
        diagnostics.push(`[Document Expiry]: ${(check.detail as { error?: string })?.error || "The ID document is expired."}`);
        break;

      case "nia":
        diagnostics.push(`[Government Registry (NIA)]: ${(check.detail as { note?: string; error?: string })?.note || "Record not found in the National Identity Register."}`);
        break;

      case "smile": {
        const detail = check.detail as { resultCode?: string; status?: string; error?: string };
        const reason = detail.error || `Result code: ${detail.resultCode || detail.status || "Check failed"}`;
        diagnostics.push(`[Smile ID Biometrics]: ${reason}`);
        break;
      }

      case "qoreid": {
        const detail = check.detail as {
          overallStatus?: string;
          matchStatus?: string;
          error?: string;
          httpStatus?: number;
          body?: { message?: string; error?: string };
        };
        const raw = check.raw as { summary?: { ghana_id_check?: { fieldMatches?: Record<string, boolean> } } };
        const fields = raw?.summary?.ghana_id_check?.fieldMatches;
        let msg = detail.error || detail.body?.message || `Status: ${detail.overallStatus || "mismatch"} (${detail.matchStatus || ""})`;
        if (fields) {
          const failedFields = Object.entries(fields).filter(([_, matched]) => !matched).map(([f]) => f);
          if (failedFields.length > 0) {
            msg += ` — Mismatched fields: ${failedFields.join(", ")}`;
          }
        }
        diagnostics.push(`[QoreID Verification]: ${msg}`);
        break;
      }

      case "sanctions": {
        const detail = check.detail as { matchedName?: string[]; note?: string };
        diagnostics.push(`[Sanctions & AML]: ${detail.note || `Matched watchlist entity: ${detail.matchedName?.join(", ")}`}`);
        break;
      }

      case "address": {
        const detail = check.detail as { error?: string };
        diagnostics.push(`[Proof of Address]: ${detail.error || "Digital address verification failed."}`);
        break;
      }

      default:
        diagnostics.push(`[${check.source.toUpperCase()}]: Check failed.`);
    }
  }

  return diagnostics;
}

/**
 * Adapter providing seamless integration between TrustRail-KYC and CediRamp's
 * user onboarding/verification pipeline (e.g. POST /v1/users).
 */
export class CediRampKycAdapter {
  constructor(private readonly orchestrator: IdentityOrchestrator) {}

  /**
   * Evaluates input, applies pre-flight validation rules, and runs the full orchestrator
   * verification pipeline (Registry + Vendor + Sanctions).
   */
  async evaluateUser(params: CediRampUserKycParams): Promise<CediRampKycDecision> {
    // 1. Format & normalize names
    const nameParts = params.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : nameParts[0] || "";

    const normalizedId = normalizeGhanaCard(params.idNumber);

    // 2. Pre-flight input validation
    if (!isValidGhanaCard(normalizedId)) {
      return {
        passed: false,
        reason: `Invalid Ghana Card format (${normalizedId}). Expected format: GHA-XXXXXXXXX-X`,
        details: {
          validationPassed: false,
          maskedAudit: maskIdentityInput({
            firstName,
            lastName,
            idNumber: normalizedId,
            dateOfBirth: params.dateOfBirth,
            phoneNumber: params.phoneNumber,
            email: params.email,
            externalRef: params.userId,
          }),
        },
      };
    }

    const dobValidation = validateDateOfBirth(params.dateOfBirth, 18);
    if (!dobValidation.valid) {
      return {
        passed: false,
        reason: dobValidation.error || "Date of birth verification failed",
        details: {
          validationPassed: false,
          maskedAudit: maskIdentityInput({
            firstName,
            lastName,
            idNumber: normalizedId,
            dateOfBirth: params.dateOfBirth,
            phoneNumber: params.phoneNumber,
            email: params.email,
            externalRef: params.userId,
          }),
        },
      };
    }

    if (params.phoneNumber) {
      const phoneValidation = validateGhanaPhoneNumber(params.phoneNumber);
      if (!phoneValidation.valid) {
        return {
          passed: false,
          reason: phoneValidation.error || "Invalid phone number format",
          details: {
            validationPassed: false,
            maskedAudit: maskIdentityInput({
              firstName,
              lastName,
              idNumber: normalizedId,
              dateOfBirth: params.dateOfBirth,
              phoneNumber: params.phoneNumber,
              email: params.email,
              externalRef: params.userId,
            }),
          },
        };
      }
    }

    const identityInput: IdentityInput = {
      firstName,
      lastName,
      idNumber: normalizedId,
      dateOfBirth: params.dateOfBirth.trim(),
      phoneNumber: normalizePhoneNumber(params.phoneNumber),
      email: params.email?.trim(),
      externalRef: params.userId,
      expiryDate: params.expiryDate?.trim(),
      digitalAddress: params.digitalAddress?.trim(),
      selfieImage: params.selfieImage,
      idCardFrontImage: params.idCardFrontImage,
    };

    // 3. Run Orchestrator
    const result = await this.orchestrator.verify(identityInput);

    const diagnostics = formatFailureDiagnostics(result);
    const reason = diagnostics.length > 0
      ? diagnostics.join(" | ")
      : undefined;

    return {
      passed: result.verified,
      flaggedForReview: result.flaggedForReview,
      reason,
      details: {
        validationPassed: true,
        verificationResult: result,
        maskedAudit: maskIdentityInput(identityInput),
      },
    };
  }
}
