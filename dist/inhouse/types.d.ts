import type { IdType } from "../types.js";
/** Extracted document data from in-house OCR */
export interface InHouseOcrResult {
    idType: IdType;
    idNumber?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    dateOfBirth?: string;
    expiryDate?: string;
    gender?: "M" | "F" | "OTHER";
    nationality?: string;
    mrz?: {
        rawLines: string[];
        validChecksum: boolean;
        docCode?: string;
        issuer?: string;
    };
    frontBackMatched?: boolean;
    confidence: number;
    extractedFields: Record<string, string>;
}
/** Biometric 1:1 facial verification result */
export interface InHouseBiometricResult {
    faceMatched: boolean;
    similarityScore: number;
    matchConfidence: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "NO_MATCH";
    thresholdApplied: number;
    liveness: {
        passed: boolean;
        score: number;
        spoofDetected: boolean;
        motionStepsCompleted?: string[];
        facialMovementScore?: number;
        flags: string[];
    };
}
/** Document integrity and anti-tamper analysis result */
export interface InHouseTamperResult {
    passed: boolean;
    tamperScore: number;
    checks: {
        resolutionValid: boolean;
        aspectRatioValid: boolean;
        compressionArtifactsNormal: boolean;
        crossFieldConsistency: boolean;
        frontBackConsistency?: boolean;
    };
    flags: string[];
}
/** Pre-flight image quality assessment result */
export interface InHouseQualityResult {
    passed: boolean;
    sharpnessScore: number;
    illuminationScore: number;
    glareScore: number;
    isBlurry: boolean;
    isDark: boolean;
    hasGlare: boolean;
    flags: string[];
}
/** Signed Verification Certificate for compliance audit */
export interface VerificationCertificate {
    certificateId: string;
    issuedAt: string;
    expiresAt: string;
    tier: "TIER_1" | "TIER_2" | "TIER_3_FULL_KYC";
    citizen: {
        fullNameMasked: string;
        idNumberMasked: string;
        dateOfBirth: string;
        nationality: string;
    };
    metrics: {
        faceMatchScore: number;
        livenessPassed: boolean;
        tamperScore: number;
        riskScore: number;
    };
    regulatory: {
        dataProtectionActConsentGiven: boolean;
        consentTimestamp?: string;
        amlPassed: boolean;
        niaVerified: boolean;
    };
    signatureAlgorithm: "HMAC-SHA256";
    signature: string;
}
/** Full self-contained verification report */
export interface InHouseVerificationReport {
    verified: boolean;
    riskScore: number;
    ocr: InHouseOcrResult;
    biometrics?: InHouseBiometricResult;
    tamperAnalysis?: InHouseTamperResult;
    qualityAnalysis?: InHouseQualityResult;
    certificate?: VerificationCertificate;
    discrepancies: string[];
    notes: string[];
}
/** Configuration options for InHouseIdentityClient */
export interface InHouseKycConfig {
    /** Minimum similarity score to pass facial matching (default: 0.78 / 78%) */
    faceMatchThreshold?: number;
    /** Minimum liveness confidence score to pass (default: 0.70 / 70%) */
    livenessThreshold?: number;
    /** Maximum acceptable tamper score before rejecting (default: 0.35 / 35%) */
    maxTamperThreshold?: number;
    /** Whether to strictly enforce document tamper checking */
    enforceTamperCheck?: boolean;
    /** Secret key used for signing compliance certificates */
    certificateSecret?: string;
}
