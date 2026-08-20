import type { IdentityCheckResult, IdentityInput, IdVerificationClient } from "../types.js";
import type { InHouseKycConfig, InHouseVerificationReport } from "./types.js";
/**
 * InHouseIdentityClient — Standalone, 100% Self-Hosted KYC Verification Engine.
 *
 * Implements `IdVerificationClient` to act as a drop-in replacement for
 * external vendors (Smile ID, QoreID) within `IdentityOrchestrator`.
 *
 * Runs:
 * 1. Pre-flight image quality evaluation (blur, glare, exposure)
 * 2. Local OCR extraction & MRZ parser
 * 3. Document integrity & anti-tamper analysis
 * 4. 1:1 Facial biometric match & active 3D motion tracking
 * 5. Document expiry, age validation, and Act 843 biometric consent
 * 6. Velocity / duplicate ID rate limiting
 * 7. Cryptographic HMAC-SHA256 verification certificate issuance
 */
export declare class InHouseIdentityClient implements IdVerificationClient {
    private readonly ocrEngine;
    private readonly biometricEngine;
    private readonly securityAnalyzer;
    private readonly qualityAnalyzer;
    private readonly velocityTracker;
    private readonly config;
    constructor(config?: InHouseKycConfig);
    /**
     * Complete in-house verification pipeline satisfying IdVerificationClient.
     */
    verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
    /**
     * Detailed in-house verification returning deep breakdown of all modules.
     */
    verifyInHouseDetailed(input: IdentityInput): Promise<InHouseVerificationReport>;
}
