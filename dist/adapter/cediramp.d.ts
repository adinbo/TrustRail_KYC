import type { IdentityOrchestrator } from "../orchestrator.js";
import type { IdentityVerificationResult } from "../types.js";
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
    idCardBackImage?: string;
    /** Explicit Data Protection Act 843 consent */
    consentGiven?: boolean;
    consentTimestamp?: string;
    ipAddress?: string;
    /** Desired KYC level (1 = Registry only, 2 = Biometrics + Address, 3 = Institutional OCR). Defaults to 1. */
    targetTier?: 1 | 2 | 3;
}
export interface CediRampKycDecision {
    passed: boolean;
    assignedTier?: 1 | 2 | 3;
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
export declare function formatFailureDiagnostics(result: IdentityVerificationResult): string[];
/**
 * Adapter providing seamless integration between TrustRail-KYC and CediRamp's
 * user onboarding/verification pipeline (e.g. POST /v1/users).
 */
export declare class CediRampKycAdapter {
    private readonly orchestrator;
    constructor(orchestrator: IdentityOrchestrator);
    /**
     * Evaluates input, applies pre-flight validation rules, and runs the full orchestrator
     * verification pipeline (Registry + Vendor + Sanctions).
     */
    evaluateUser(params: CediRampUserKycParams): Promise<CediRampKycDecision>;
}
