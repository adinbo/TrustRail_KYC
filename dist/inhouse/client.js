import { InHouseOcrEngine } from "./ocr.js";
import { InHouseBiometricEngine } from "./biometrics.js";
import { InHouseSecurityAnalyzer } from "./security.js";
import { InHouseQualityAnalyzer } from "./quality.js";
import { InHouseVelocityTracker } from "./registry.js";
import { generateVerificationCertificate } from "./certificate.js";
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
export class InHouseIdentityClient {
    ocrEngine;
    biometricEngine;
    securityAnalyzer;
    qualityAnalyzer;
    velocityTracker;
    config;
    constructor(config) {
        this.config = config ?? {};
        this.ocrEngine = new InHouseOcrEngine();
        this.biometricEngine = new InHouseBiometricEngine({
            matchThreshold: this.config.faceMatchThreshold ?? 0.78,
            livenessThreshold: this.config.livenessThreshold ?? 0.70,
        });
        this.securityAnalyzer = new InHouseSecurityAnalyzer({
            maxTamperThreshold: this.config.maxTamperThreshold ?? 0.35,
        });
        this.qualityAnalyzer = new InHouseQualityAnalyzer();
        this.velocityTracker = new InHouseVelocityTracker();
    }
    /**
     * Complete in-house verification pipeline satisfying IdVerificationClient.
     */
    async verifyIdentity(input) {
        const report = await this.verifyInHouseDetailed(input);
        return {
            source: "inhouse",
            pass: report.verified,
            detail: {
                riskScore: report.riskScore,
                ocr: report.ocr,
                discrepancies: report.discrepancies,
                notes: report.notes,
                tamperScore: report.tamperAnalysis?.tamperScore,
                certificate: report.certificate,
            },
            biometrics: report.biometrics
                ? {
                    faceMatchScore: report.biometrics.similarityScore,
                    livenessPassed: report.biometrics.liveness.passed,
                    confidenceLevel: report.biometrics.matchConfidence,
                }
                : undefined,
            raw: report,
        };
    }
    /**
     * Detailed in-house verification returning deep breakdown of all modules.
     */
    async verifyInHouseDetailed(input) {
        const discrepancies = [];
        const notes = [];
        // 1. Regulatory Biometric Consent Gate (Ghana Act 843)
        if (input.consentGiven === false) {
            discrepancies.push("CONSENT_WITHHELD: Citizen biometric verification consent was not granted.");
        }
        const hasImages = Boolean(input.idCardFrontImage || input.selfieImage || input.idCardBackImage);
        // 2. Artifact Quality Checks (if images are provided)
        let frontQuality = {
            passed: true,
            sharpnessScore: 0.95,
            illuminationScore: 0.85,
            glareScore: 0.05,
            isBlurry: false,
            isDark: false,
            hasGlare: false,
            flags: [],
        };
        let backQuality = { ...frontQuality };
        let selfieQuality = { ...frontQuality };
        if (hasImages) {
            if (input.idCardFrontImage) {
                frontQuality = this.qualityAnalyzer.evaluateQuality(input.idCardFrontImage, "Front ID");
                if (!frontQuality.passed)
                    discrepancies.push(...frontQuality.flags);
            }
            if (input.idCardBackImage) {
                backQuality = this.qualityAnalyzer.evaluateQuality(input.idCardBackImage, "Back MRZ");
                if (!backQuality.passed)
                    discrepancies.push(...backQuality.flags);
            }
            if (input.selfieImage) {
                selfieQuality = this.qualityAnalyzer.evaluateQuality(input.selfieImage, "Selfie");
                if (!selfieQuality.passed)
                    discrepancies.push(...selfieQuality.flags);
            }
        }
        else {
            notes.push("Text Registry Verification Mode (no biometric images provided)");
        }
        // 3. Duplicate ID & Velocity Rate Limiting
        const velocity = this.velocityTracker.evaluateAndRecord(input.idNumber, input.externalRef, input.ipAddress);
        if (!velocity.passed) {
            discrepancies.push(...velocity.flags);
        }
        // 4. OCR Extraction (if images provided, otherwise mock/extract from text)
        const ocr = await this.ocrEngine.extractDocumentData(input);
        notes.push(`OCR / Registry extraction completed with confidence ${(ocr.confidence * 100).toFixed(1)}%`);
        // 5. Document Expiry Enforcement
        const expiryStr = ocr.expiryDate || input.expiryDate;
        if (expiryStr) {
            const expDate = new Date(expiryStr);
            if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
                discrepancies.push(`EXPIRED_GHANA_CARD_DOCUMENT: Document expired on ${expiryStr}. Physical renewal required.`);
            }
        }
        // 6. Age Enforcement (18+ requirement)
        if (input.dateOfBirth) {
            const dob = new Date(input.dateOfBirth);
            if (!isNaN(dob.getTime())) {
                const ageDifMs = Date.now() - dob.getTime();
                const ageDate = new Date(ageDifMs);
                const age = Math.abs(ageDate.getUTCFullYear() - 1970);
                if (age < 18) {
                    discrepancies.push(`UNDERAGE_APPLICANT: Citizen is ${age} years old (minimum 18 required for KYC).`);
                }
            }
        }
        // 7. Document Security & Tamper Analysis (when images present)
        let tamperAnalysis = {
            passed: true,
            tamperScore: 0.0,
            checks: {
                resolutionValid: true,
                aspectRatioValid: true,
                compressionArtifactsNormal: true,
                crossFieldConsistency: true,
                frontBackConsistency: true,
            },
            flags: [],
        };
        if (hasImages && input.idCardFrontImage) {
            tamperAnalysis = this.securityAnalyzer.analyzeDocument(input, ocr);
            if (!tamperAnalysis.passed) {
                discrepancies.push(...tamperAnalysis.flags);
            }
        }
        // 8. 1:1 Biometrics & Active Liveness (when selfie & front ID present)
        let biometrics = undefined;
        if (input.idCardFrontImage && input.selfieImage) {
            biometrics = await this.biometricEngine.compareFaces(input.idCardFrontImage, input.selfieImage);
            if (!biometrics.faceMatched) {
                discrepancies.push(`Biometric facial match failed (Score: ${(biometrics.similarityScore * 100).toFixed(1)}%, Threshold: ${(biometrics.thresholdApplied * 100).toFixed(1)}%)`);
            }
            if (!biometrics.liveness.passed) {
                discrepancies.push(`Biometric liveness failed: ${biometrics.liveness.flags.join(", ")}`);
            }
        }
        // Determine Overall Verification Status
        const ocrPassed = ocr.confidence >= 0.40 && (!!ocr.idNumber || !!input.idNumber);
        const tamperPassed = !this.config.enforceTamperCheck || tamperAnalysis.passed;
        const bioPassed = !biometrics || (biometrics.faceMatched && biometrics.liveness.passed);
        const qualityPassed = frontQuality.passed && backQuality.passed && selfieQuality.passed;
        const verified = ocrPassed && tamperPassed && bioPassed && qualityPassed && discrepancies.length === 0;
        // Calculate composite risk score (0 = lowest risk, 100 = highest risk)
        let riskScore = 5.0;
        if (!ocrPassed)
            riskScore += 40.0;
        if (!qualityPassed)
            riskScore += 25.0;
        if (tamperAnalysis.tamperScore > 0.2)
            riskScore += tamperAnalysis.tamperScore * 50;
        if (biometrics && !biometrics.faceMatched)
            riskScore += 45.0;
        if (biometrics && !biometrics.liveness.passed)
            riskScore += 40.0;
        if (discrepancies.length > 0)
            riskScore += discrepancies.length * 15.0;
        riskScore = Math.min(100.0, Math.max(0.0, riskScore));
        const finalReport = {
            verified,
            riskScore: parseFloat(riskScore.toFixed(1)),
            ocr,
            biometrics,
            tamperAnalysis,
            qualityAnalysis: frontQuality,
            discrepancies,
            notes,
        };
        // 9. Generate Signed Cryptographic Verification Certificate on Success
        if (verified) {
            finalReport.certificate = generateVerificationCertificate(input, finalReport, this.config.certificateSecret);
        }
        return finalReport;
    }
}
//# sourceMappingURL=client.js.map