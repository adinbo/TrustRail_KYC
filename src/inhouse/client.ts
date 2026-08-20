import type { IdentityCheckResult, IdentityInput, IdVerificationClient } from "../types.js";
import { InHouseOcrEngine } from "./ocr.js";
import { InHouseBiometricEngine } from "./biometrics.js";
import { InHouseSecurityAnalyzer } from "./security.js";
import { InHouseQualityAnalyzer } from "./quality.js";
import { InHouseVelocityTracker } from "./registry.js";
import { generateVerificationCertificate } from "./certificate.js";
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
export class InHouseIdentityClient implements IdVerificationClient {
  private readonly ocrEngine: InHouseOcrEngine;
  private readonly biometricEngine: InHouseBiometricEngine;
  private readonly securityAnalyzer: InHouseSecurityAnalyzer;
  private readonly qualityAnalyzer: InHouseQualityAnalyzer;
  private readonly velocityTracker: InHouseVelocityTracker;
  private readonly config: InHouseKycConfig;

  constructor(config?: InHouseKycConfig) {
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
  async verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult> {
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
  async verifyInHouseDetailed(input: IdentityInput): Promise<InHouseVerificationReport> {
    const discrepancies: string[] = [];
    const notes: string[] = [];

    // 1. Regulatory Biometric Consent Gate (Ghana Act 843)
    if (input.consentGiven === false) {
      discrepancies.push("CONSENT_WITHHELD: Citizen biometric verification consent was not granted.");
    }

    // 2. Mandatory Artifact Checks
    if (!input.idCardFrontImage || input.idCardFrontImage.trim().length === 0) {
      discrepancies.push("MISSING_ID_CARD_FRONT: Ghana Card front image must be scanned or uploaded.");
    }
    if (!input.idCardBackImage || input.idCardBackImage.trim().length === 0) {
      discrepancies.push("MISSING_ID_CARD_BACK_MRZ: Ghana Card back MRZ barcode image must be scanned or uploaded.");
    }
    if (!input.selfieImage || input.selfieImage.trim().length === 0) {
      discrepancies.push("MISSING_FACIAL_BIOMETRIC: Active 3D facial motion selfie is required.");
    }

    // 3. Pre-Flight Image Quality Checks (Blur, Glare, Exposure)
    const frontQuality = this.qualityAnalyzer.evaluateQuality(input.idCardFrontImage, "Front ID");
    const backQuality = this.qualityAnalyzer.evaluateQuality(input.idCardBackImage, "Back MRZ");
    const selfieQuality = this.qualityAnalyzer.evaluateQuality(input.selfieImage, "Selfie");

    if (!frontQuality.passed) discrepancies.push(...frontQuality.flags);
    if (!backQuality.passed) discrepancies.push(...backQuality.flags);
    if (!selfieQuality.passed) discrepancies.push(...selfieQuality.flags);

    // 4. Duplicate ID & Velocity Rate Limiting
    const velocity = this.velocityTracker.evaluateAndRecord(
      input.idNumber,
      input.externalRef,
      input.ipAddress,
    );
    if (!velocity.passed) {
      discrepancies.push(...velocity.flags);
    }

    // 5. OCR Extraction
    const ocr = await this.ocrEngine.extractDocumentData(input);
    notes.push(`OCR extraction completed with confidence ${(ocr.confidence * 100).toFixed(1)}%`);

    // 6. Document Expiry Enforcement
    const expiryStr = ocr.expiryDate || input.expiryDate;
    if (expiryStr) {
      const expDate = new Date(expiryStr);
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        discrepancies.push(`EXPIRED_GHANA_CARD_DOCUMENT: Document expired on ${expiryStr}. Physical renewal required.`);
      }
    }

    // 7. Age Enforcement (18+ requirement)
    if (input.dateOfBirth) {
      const dob = new Date(input.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (age < 18) {
          discrepancies.push(`UNDERAGE_APPLICANT: Citizen is ${age} years old (minimum 18 required for Tier 3 KYC).`);
        }
      }
    }

    // 8. Document Security & Tamper Analysis
    const tamperAnalysis = this.securityAnalyzer.analyzeDocument(input, ocr);
    if (!tamperAnalysis.passed) {
      discrepancies.push(...tamperAnalysis.flags);
    }

    // 9. 1:1 Biometrics & Active Liveness
    const biometrics = await this.biometricEngine.compareFaces(
      input.idCardFrontImage,
      input.selfieImage,
    );

    if (!biometrics.faceMatched) {
      discrepancies.push(`Biometric facial match failed (Score: ${(biometrics.similarityScore * 100).toFixed(1)}%, Threshold: ${(biometrics.thresholdApplied * 100).toFixed(1)}%)`);
    }
    if (!biometrics.liveness.passed) {
      discrepancies.push(`Biometric liveness failed: ${biometrics.liveness.flags.join(", ")}`);
    }

    // Determine Overall Verification Status
    const ocrPassed = (ocr.confidence >= 0.50) && !!ocr.idNumber;
    const tamperPassed = !this.config.enforceTamperCheck || tamperAnalysis.passed;
    const bioPassed = biometrics.faceMatched && biometrics.liveness.passed;
    const qualityPassed = frontQuality.passed && backQuality.passed && selfieQuality.passed;

    const verified = ocrPassed && tamperPassed && bioPassed && qualityPassed && discrepancies.length === 0;

    // Calculate composite risk score (0 = lowest risk, 100 = highest risk)
    let riskScore = 8.0;
    if (!ocrPassed) riskScore += 40.0;
    if (!qualityPassed) riskScore += 25.0;
    if (tamperAnalysis.tamperScore > 0.2) riskScore += tamperAnalysis.tamperScore * 50;
    if (!biometrics.faceMatched) riskScore += 45.0;
    if (!biometrics.liveness.passed) riskScore += 40.0;
    if (discrepancies.length > 0) riskScore += discrepancies.length * 15.0;
    riskScore = Math.min(100.0, Math.max(0.0, riskScore));

    const finalReport: InHouseVerificationReport = {
      verified,
      riskScore: parseFloat(riskScore.toFixed(1)),
      ocr,
      biometrics,
      tamperAnalysis,
      qualityAnalysis: frontQuality,
      discrepancies,
      notes,
    };

    // 10. Generate Signed Cryptographic Verification Certificate on Success
    if (verified) {
      finalReport.certificate = generateVerificationCertificate(
        input,
        finalReport,
        this.config.certificateSecret,
      );
    }

    return finalReport;
  }
}
