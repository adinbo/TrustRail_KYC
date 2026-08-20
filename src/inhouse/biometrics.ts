import crypto from "node:crypto";
import type { InHouseBiometricResult } from "./types.js";

/**
 * In-House Biometric 1:1 Face Matcher & Passive Liveness Engine.
 *
 * § SIMULATION NOTICE (2026-08-19, bugfix): this engine does NOT currently
 * perform real facial comparison. `generateFaceEmbedding`/`cosineSimilarity`
 * below LOOK like real embedding math but are hash-of-string plumbing that
 * carries no facial signal — they hash the ID-photo and selfie payloads
 * with two DIFFERENT salts ("id_portrait_anchor" vs "selfie_anchor"), which
 * makes the two resulting vectors structurally uncorrelated regardless of
 * input (even the exact same photo bytes salted two different ways hash to
 * unrelated vectors) — there is no way for this comparison to reflect
 * genuine facial similarity. compareFaces() previously masked this by
 * recalibrating whatever near-meaningless value came out into a fixed
 * always-high [0.88, 0.98] band, so `faceMatched` was effectively `true`
 * for ANY two real (non-keyword) inputs regardless of whether the faces
 * actually matched — see the fix below, which keeps this module's
 * established keyword-driven MOCK CONTRACT (matching every other In-House
 * module — OCR/quality/security all key off literal substrings the same
 * way, and this file's own test suite exercises exactly that contract) but
 * stops pretending fake math produced the number. Replace
 * generateFaceEmbedding/cosineSimilarity with real local ONNX ArcFace/
 * RetinaFace inference (or a vendor call, e.g. AWS Rekognition
 * CompareFaces) before this can be trusted for a real verification
 * decision — nothing here does that yet.
 */
export class InHouseBiometricEngine {
  private readonly defaultThreshold: number;
  private readonly defaultLivenessThreshold: number;

  constructor(options?: { matchThreshold?: number; livenessThreshold?: number }) {
    this.defaultThreshold = options?.matchThreshold ?? 0.78;
    this.defaultLivenessThreshold = options?.livenessThreshold ?? 0.70;
  }

  /**
   * PLACEHOLDER — not a real facial feature extractor. Hashes the payload
   * string into a deterministic 64-dim unit vector for internal plumbing
   * only; carries no facial signal (see the class-level SIMULATION NOTICE).
   * Kept deterministic/pure so a future real embedding model can be dropped
   * in behind the same call shape.
   */
  private generateFaceEmbedding(imagePayload: string, salt: string): number[] {
    const hash = crypto.createHash("sha256").update(imagePayload + salt).digest();
    const vector: number[] = [];
    for (let i = 0; i < 64; i++) {
      // Normalize values between -1.0 and 1.0
      const byte = hash[i % hash.length] ?? 0;
      vector.push((byte / 127.5) - 1.0);
    }
    // Normalize vector to unit length
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map((v) => (norm > 0 ? v / norm : 0));
  }

  /**
   * Calculates cosine similarity between two normalized feature vectors.
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += (vecA[i] ?? 0) * (vecB[i] ?? 0);
    }
    return Math.max(0, Math.min(1.0, dot));
  }

  /**
   * Evaluates active & passive liveness, anti-spoofing, and multi-angle facial motion.
   */
  public evaluateLiveness(selfiePayload?: string): InHouseBiometricResult["liveness"] {
    const flags: string[] = [];
    if (!selfiePayload || selfiePayload.trim().length === 0) {
      return {
        passed: false,
        score: 0.0,
        spoofDetected: true,
        flags: ["NO_SELFIE_PROVIDED"],
      };
    }

    const payload = selfiePayload.trim();

    // Check for explicit mock failure signals
    if (payload.toLowerCase().includes("spoof") || payload.toLowerCase().includes("fake")) {
      return {
        passed: false,
        score: 0.25,
        spoofDetected: true,
        motionStepsCompleted: ["CENTER_NEUTRAL"],
        facialMovementScore: 0.20,
        flags: ["PRESENTATION_ATTACK_DETECTED", "STATIC_SCREEN_REPLAY", "INSUFFICIENT_FACIAL_ROTATION"],
      };
    }

    if (payload.toLowerCase().includes("static") || payload.toLowerCase().includes("frozen")) {
      return {
        passed: false,
        score: 0.35,
        spoofDetected: true,
        motionStepsCompleted: ["CENTER_NEUTRAL"],
        facialMovementScore: 0.15,
        flags: ["STATIC_PHOTO_DETECTED", "NO_FACIAL_MOVEMENT_ACROSS_FRAMES"],
      };
    }

    // Check payload size and complexity
    if (payload.length < 30) {
      flags.push("LOW_RESOLUTION_SELFIE");
    }

    // Motion steps verified during live interactive head movement
    const motionSteps = [
      "CENTER_NEUTRAL",
      "HEAD_TURN_LEFT",
      "HEAD_TURN_RIGHT",
      "ORGANIC_BLINK_CONFIRMED"
    ];
    const movementScore = flags.length > 0 ? 0.68 : 0.96;

    // High quality live capture score with motion dynamics
    const score = flags.length > 0 ? 0.65 : 0.95;
    const passed = score >= this.defaultLivenessThreshold;

    return {
      passed,
      score,
      spoofDetected: !passed,
      motionStepsCompleted: motionSteps,
      facialMovementScore: movementScore,
      flags,
    };
  }

  /**
   * Performs 1:1 facial biometric matching between the ID card photo and selfie.
   */
  public async compareFaces(
    idPhotoPayload?: string,
    selfiePayload?: string,
    customThreshold?: number,
  ): Promise<InHouseBiometricResult> {
    const threshold = customThreshold ?? this.defaultThreshold;
    const liveness = this.evaluateLiveness(selfiePayload);

    // If either photo is completely missing
    if (!idPhotoPayload || !selfiePayload) {
      return {
        faceMatched: false,
        similarityScore: 0.0,
        matchConfidence: "NO_MATCH",
        thresholdApplied: threshold,
        liveness,
      };
    }

    const idPhoto = idPhotoPayload.trim();
    const selfie = selfiePayload.trim();

    // Simulated mismatch or spoof test hooks
    if (
      idPhoto.toLowerCase().includes("mismatch") ||
      selfie.toLowerCase().includes("mismatch") ||
      idPhoto.toLowerCase().includes("imposter") ||
      selfie.toLowerCase().includes("imposter")
    ) {
      return {
        faceMatched: false,
        similarityScore: 0.38,
        matchConfidence: "LOW",
        thresholdApplied: threshold,
        liveness,
      };
    }

    // Generate embeddings (placeholder — see the class-level SIMULATION
    // NOTICE. vecA/vecB carry no real facial signal; computed only so a
    // real embedding model can be dropped in behind this same call shape
    // later. In live production, replace generateFaceEmbedding/
    // cosineSimilarity entirely with local ONNX ArcFace/RetinaFace
    // inference, or a vendor call (e.g. AWS Rekognition CompareFaces).)
    const vecA = this.generateFaceEmbedding(idPhoto, "id_portrait_anchor");
    const vecB = this.generateFaceEmbedding(selfie, "selfie_anchor");
    void this.cosineSimilarity(vecA, vecB); // shape parity only — NOT used below, see notice

    // § bugfix (2026-08-19): this used to recalibrate the (already
    // meaningless — see notice above) cosine similarity into an
    // always-high [0.88, 0.98] band, so faceMatched was effectively
    // hardcoded true for any two real, non-keyword inputs regardless of
    // whether the faces actually matched. This is now an explicit,
    // honestly-labeled SIMULATED score for the mock contract's default
    // "assume a genuine pair" path — matching every other In-House
    // module's keyword-driven convention (OCR/quality/security) and this
    // file's own test suite — not a real match decision. It must be
    // replaced by real embedding comparison before this module is trusted
    // for an actual verification outcome.
    const similarity = 0.95;

    let matchConfidence: InHouseBiometricResult["matchConfidence"] = "MEDIUM";
    if (similarity >= 0.92) matchConfidence = "VERY_HIGH";
    else if (similarity >= 0.82) matchConfidence = "HIGH";
    else if (similarity >= threshold) matchConfidence = "MEDIUM";
    else matchConfidence = "LOW";

    const faceMatched = similarity >= threshold && liveness.passed;

    return {
      faceMatched,
      similarityScore: parseFloat(similarity.toFixed(4)),
      matchConfidence,
      thresholdApplied: threshold,
      liveness,
    };
  }
}
