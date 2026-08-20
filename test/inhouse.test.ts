import { describe, it, expect } from "vitest";
import {
  InHouseIdentityClient,
  InHouseOcrEngine,
  InHouseBiometricEngine,
  InHouseSecurityAnalyzer,
  InHouseQualityAnalyzer,
  InHouseVelocityTracker,
  verifyCertificateSignature,
  parseMrz,
  IdentityOrchestrator,
  MockNiaClient,
  MockSanctionsClient,
  MockGhanaPostClient,
  CediRampKycAdapter,
} from "../src/index.js";
import type { IdentityInput } from "../src/types.js";

const validGhanaianUser: IdentityInput = {
  firstName: "Kwame",
  lastName: "Mensah",
  idNumber: "GHA-123456789-1",
  dateOfBirth: "1994-05-15",
  phoneNumber: "+233244123456",
  email: "kwame.mensah@example.com",
  externalRef: "test-user-kwame",
  expiryDate: "2032-05-14",
  digitalAddress: "AK-039-5028",
  idCardFrontImage: "data:image/jpeg;base64,sample_id_card_front_valid_high_res",
  idCardBackImage: "data:image/jpeg;base64,sample_id_card_back_valid_high_res_mrz",
  selfieImage: "data:image/jpeg;base64,sample_live_user_selfie_stream_sharp",
};

describe("In-House KYC Engine: OCR & MRZ", () => {
  const ocr = new InHouseOcrEngine();

  it("extracts structured identity fields from user input", async () => {
    const res = await ocr.extractDocumentData(validGhanaianUser);
    expect(res.idNumber).toBe("GHA-123456789-1");
    expect(res.firstName).toBe("Kwame");
    expect(res.lastName).toBe("Mensah");
    expect(res.fullName).toBe("Kwame Mensah");
    expect(res.dateOfBirth).toBe("1994-05-15");
    expect(res.mrz).toBeDefined();
    expect(res.mrz?.validChecksum).toBe(true);
    expect(res.confidence).toBeGreaterThan(0.8);
  });

  it("parses TD1 standard 3-line MRZ correctly", () => {
    const lines = [
      "I<GHA123456789<<<<<<<<<<<<<<<",
      "9405150M3205140GHA<<<<<<<<<<<0",
      "MENSAH<<KWAME<<<<<<<<<<<<<<<<<",
    ];
    const parsed = parseMrz(lines);
    expect(parsed.validChecksum).toBe(true);
    expect(parsed.issuer).toBe("GHA");
    expect(parsed.docNumber).toBe("123456789");
    expect(parsed.dob).toBe("1994-05-15");
    expect(parsed.expiry).toBe("2032-05-14");
    expect(parsed.gender).toBe("M");
    expect(parsed.lastName).toBe("MENSAH");
    expect(parsed.firstName).toBe("KWAME");
  });
  it("validates 2-sided ID documents with matching front and back MRZ", async () => {
    const twoSidedInput = {
      ...validGhanaianUser,
      idCardFrontImage: "data:image/jpeg;base64,valid_high_res_sample_front_id_document_image_data_buffer",
      idCardBackImage: "data:image/jpeg;base64,valid_high_res_sample_back_mrz_barcode_image_data_buffer",
    };
    const res = await ocr.extractDocumentData(twoSidedInput);
    expect(res.frontBackMatched).toBe(true);
    expect(res.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it("detects front and back document mismatch", async () => {
    const mismatchedTwoSided = {
      ...validGhanaianUser,
      idCardFrontImage: "data:image/jpeg;base64,valid_front_image",
      idCardBackImage: "data:image/jpeg;base64,mismatch_back_conflict_image",
    };
    const res = await ocr.extractDocumentData(mismatchedTwoSided);
    expect(res.frontBackMatched).toBe(false);
  });
});

describe("In-House KYC Engine: Biometrics & Liveness", () => {
  const bio = new InHouseBiometricEngine({ matchThreshold: 0.78, livenessThreshold: 0.70 });

  it("passes genuine matching face pair with multi-step live motion", async () => {
    const res = await bio.compareFaces(
      validGhanaianUser.idCardFrontImage,
      validGhanaianUser.selfieImage,
    );
    expect(res.faceMatched).toBe(true);
    expect(res.similarityScore).toBeGreaterThanOrEqual(0.78);
    expect(res.liveness.passed).toBe(true);
    expect(res.liveness.spoofDetected).toBe(false);
    expect(res.liveness.motionStepsCompleted).toContain("HEAD_TURN_LEFT");
    expect(res.liveness.motionStepsCompleted).toContain("HEAD_TURN_RIGHT");
    expect(res.liveness.facialMovementScore).toBeGreaterThan(0.7);
  });

  it("fails when static non-moving photo is presented", async () => {
    const staticSelfie = "data:image/jpeg;base64,static_photo_no_motion";
    const res = await bio.compareFaces(validGhanaianUser.idCardFrontImage, staticSelfie);
    expect(res.faceMatched).toBe(false);
    expect(res.liveness.passed).toBe(false);
    expect(res.liveness.spoofDetected).toBe(true);
    expect(res.liveness.flags).toContain("STATIC_PHOTO_DETECTED");
  });

  it("fails when presentation attack / spoof is detected in selfie", async () => {
    const spoofSelfie = "data:image/jpeg;base64,static_screen_replay_spoof_attack";
    const res = await bio.compareFaces(validGhanaianUser.idCardFrontImage, spoofSelfie);
    expect(res.faceMatched).toBe(false);
    expect(res.liveness.passed).toBe(false);
    expect(res.liveness.spoofDetected).toBe(true);
    expect(res.liveness.flags).toContain("PRESENTATION_ATTACK_DETECTED");
  });

  it("detects static presentation replay attacks", () => {
    const spoofResult = bio.evaluateLiveness("data:image/jpeg;base64,spoof_attack_static_screen");
    expect(spoofResult.passed).toBe(false);
    expect(spoofResult.spoofDetected).toBe(true);
    expect(spoofResult.flags.length).toBeGreaterThan(0);
  });

  it("evaluates active multi-angle 3D head movement challenge", () => {
    const multiAnglePayload = "data:image/jpeg;base64,frame_center_frame_left_frame_right_frame_smile";
    const motionResult = bio.evaluateLiveness(multiAnglePayload);
    expect(motionResult.passed).toBe(true);
    expect(motionResult.spoofDetected).toBe(false);
    expect(motionResult.motionStepsCompleted).toContain("HEAD_TURN_LEFT");
  });
});

describe("In-House KYC Engine: Pre-Flight Image Quality", () => {
  const quality = new InHouseQualityAnalyzer();

  it("passes high-clarity sharp images", () => {
    const res = quality.evaluateQuality("data:image/jpeg;base64,valid_sharp_card_front", "front");
    expect(res.passed).toBe(true);
    expect(res.isBlurry).toBe(false);
    expect(res.isDark).toBe(false);
    expect(res.hasGlare).toBe(false);
  });

  it("detects blurry images and flags warning", () => {
    const res = quality.evaluateQuality("data:image/jpeg;base64,blurry_defocused_capture", "front");
    expect(res.passed).toBe(false);
    expect(res.isBlurry).toBe(true);
    expect(res.flags.some((f: string) => f.includes("BLURRY"))).toBe(true);
  });

  it("detects dark underexposed images", () => {
    const res = quality.evaluateQuality("data:image/jpeg;base64,dark_night_underexposed", "front");
    expect(res.passed).toBe(false);
    expect(res.isDark).toBe(true);
    expect(res.flags.some((f: string) => f.includes("TOO_DARK"))).toBe(true);
  });

  it("detects flash glare hotspots", () => {
    const res = quality.evaluateQuality("data:image/jpeg;base64,glare_reflection_flash", "front");
    expect(res.passed).toBe(false);
    expect(res.hasGlare).toBe(true);
    expect(res.flags.some((f: string) => f.includes("GLARE_DETECTED"))).toBe(true);
  });
});

describe("In-House KYC Engine: Velocity & Sybil Defense", () => {
  it("detects multi-account duplicate Ghana Card reuse", () => {
    const tracker = new InHouseVelocityTracker({ maxAttemptsPerWindow: 5 });

    // First user submits ID
    const res1 = tracker.evaluateAndRecord("GHA-123456789-1", "user-alice");
    expect(res1.passed).toBe(true);
    expect(res1.duplicateAccountsDetected.length).toBe(0);

    // Second user attempts to register the same ID
    const res2 = tracker.evaluateAndRecord("GHA-123456789-1", "user-bob-fraud");
    expect(res2.passed).toBe(false);
    expect(res2.duplicateAccountsDetected).toContain("user-alice");
    expect(res2.flags.some((f: string) => f.includes("DUPLICATE_ID_MULTI_ACCOUNT_ALERT"))).toBe(true);
  });

  it("throttles rapid burst submissions", () => {
    const tracker = new InHouseVelocityTracker({ maxAttemptsPerWindow: 3 });
    tracker.evaluateAndRecord("GHA-999999999-9", "user-burst");
    tracker.evaluateAndRecord("GHA-999999999-9", "user-burst");
    tracker.evaluateAndRecord("GHA-999999999-9", "user-burst");

    const burst = tracker.evaluateAndRecord("GHA-999999999-9", "user-burst");
    expect(burst.passed).toBe(false);
    expect(burst.flags.some((f: string) => f.includes("VELOCITY_RATE_LIMIT_EXCEEDED"))).toBe(true);
  });
});

describe("In-House KYC Engine: Security & Anti-Tamper", () => {
  const sec = new InHouseSecurityAnalyzer();
  const ocr = new InHouseOcrEngine();

  it("passes clean untampered document", async () => {
    const ocrRes = await ocr.extractDocumentData(validGhanaianUser);
    const tamperRes = sec.analyzeDocument(validGhanaianUser, ocrRes);
    expect(tamperRes.passed).toBe(true);
  });

  it("detects digital image manipulation signals", async () => {
    const tamperedInput = {
      ...validGhanaianUser,
      idCardFrontImage: "data:image/jpeg;base64,tampered_photoshop_forged_document",
    };
    const ocrRes = await ocr.extractDocumentData(tamperedInput);
    const tamperRes = sec.analyzeDocument(tamperedInput, ocrRes);
    expect(tamperRes.passed).toBe(false);
    expect(tamperRes.tamperScore).toBeGreaterThan(0.35);
    expect(tamperRes.flags).toContain("DOCUMENT_DIGITAL_MANIPULATION_DETECTED");
  });
});

describe("In-House KYC Engine: Compliance Certificates & Regulations", () => {
  it("generates and verifies cryptographic HMAC-SHA256 certificates", async () => {
    const client = new InHouseIdentityClient();
    const report = await client.verifyInHouseDetailed(validGhanaianUser);

    expect(report.verified).toBe(true);
    expect(report.certificate).toBeDefined();

    if (report.certificate) {
      expect(report.certificate.tier).toBe("TIER_3_FULL_KYC");
      expect(report.certificate.signatureAlgorithm).toBe("HMAC-SHA256");
      expect(report.certificate.citizen.idNumberMasked).toContain("GHA-1234");
      expect(verifyCertificateSignature(report.certificate)).toBe(true);
    }
  });

  it("rejects expired Ghana Cards", async () => {
    const client = new InHouseIdentityClient();
    const expiredUser = {
      ...validGhanaianUser,
      expiryDate: "2020-01-01",
    };
    const report = await client.verifyInHouseDetailed(expiredUser);
    expect(report.verified).toBe(false);
    expect(report.discrepancies.some((d: string) => d.includes("EXPIRED_GHANA_CARD"))).toBe(true);
  });

  it("rejects underage applicants below 18", async () => {
    const client = new InHouseIdentityClient();
    const underageUser = {
      ...validGhanaianUser,
      dateOfBirth: "2018-05-15",
    };
    const report = await client.verifyInHouseDetailed(underageUser);
    expect(report.verified).toBe(false);
    expect(report.discrepancies.some((d: string) => d.includes("UNDERAGE_APPLICANT"))).toBe(true);
  });

  it("strictly rejects verification if consent is withheld", async () => {
    const client = new InHouseIdentityClient();
    const noConsentUser = {
      ...validGhanaianUser,
      consentGiven: false,
    };
    const report = await client.verifyInHouseDetailed(noConsentUser);
    expect(report.verified).toBe(false);
    expect(report.discrepancies.some((d: string) => d.includes("CONSENT_WITHHELD"))).toBe(true);
  });

  it("integrates seamlessly into IdentityOrchestrator and CediRampKycAdapter", async () => {
    const inhouseClient = new InHouseIdentityClient();
    const orchestrator = new IdentityOrchestrator(
      new MockNiaClient(),
      inhouseClient,
      new MockSanctionsClient(),
      new MockGhanaPostClient(),
    );

    const fullResult = await orchestrator.verify(validGhanaianUser);
    expect(fullResult.verified).toBe(true);

    const adapter = new CediRampKycAdapter(orchestrator);
    const decision = await adapter.evaluateUser({
      userId: "test-user-kwame",
      fullName: "Kwame Mensah",
      idNumber: "GHA-123456789-1",
      dateOfBirth: "1994-05-15",
      phoneNumber: "+233244123456",
      email: "kwame.mensah@example.com",
      expiryDate: "2032-05-14",
      digitalAddress: "AK-039-5028",
      idCardFrontImage: "data:image/jpeg;base64,valid_card_front",
      idCardBackImage: "data:image/jpeg;base64,valid_card_back",
      selfieImage: "data:image/jpeg;base64,valid_live_selfie",
      consentGiven: true,
    });

    expect(decision.passed).toBe(true);
    expect(decision.reason).toBeUndefined();
  });
});
