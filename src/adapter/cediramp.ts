import type { IdentityOrchestrator } from "../orchestrator.js";
import type { IdentityInput, IdentityVerificationResult } from "../types.js";
import { isValidGhanaCard, normalizeGhanaCard, validateDateOfBirth, normalizePhoneNumber } from "../validation.js";
import { maskIdentityInput } from "../utils/masking.js";

export interface CediRampUserKycParams {
  userId: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  phoneNumber?: string;
  email?: string;
}

export interface CediRampKycDecision {
  passed: boolean;
  reason?: string;
  details: {
    validationPassed: boolean;
    verificationResult?: IdentityVerificationResult;
    maskedAudit: Record<string, unknown>;
  };
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

    const identityInput: IdentityInput = {
      firstName,
      lastName,
      idNumber: normalizedId,
      dateOfBirth: params.dateOfBirth.trim(),
      phoneNumber: normalizePhoneNumber(params.phoneNumber),
      email: params.email?.trim(),
      externalRef: params.userId,
    };

    // 3. Run Orchestrator
    const result = await this.orchestrator.verify(identityInput);

    const failedChecks = result.checks.filter((c) => !c.pass);
    const reason = failedChecks.length > 0
      ? `Verification failed on checks: ${failedChecks.map((c) => c.source).join(", ")}`
      : undefined;

    return {
      passed: result.verified,
      reason,
      details: {
        validationPassed: true,
        verificationResult: result,
        maskedAudit: maskIdentityInput(identityInput),
      },
    };
  }
}
