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
export declare class InHouseBiometricEngine {
    private readonly defaultThreshold;
    private readonly defaultLivenessThreshold;
    constructor(options?: {
        matchThreshold?: number;
        livenessThreshold?: number;
    });
    /**
     * PLACEHOLDER — not a real facial feature extractor. Hashes the payload
     * string into a deterministic 64-dim unit vector for internal plumbing
     * only; carries no facial signal (see the class-level SIMULATION NOTICE).
     * Kept deterministic/pure so a future real embedding model can be dropped
     * in behind the same call shape.
     */
    private generateFaceEmbedding;
    /**
     * Calculates cosine similarity between two normalized feature vectors.
     */
    private cosineSimilarity;
    /**
     * Evaluates active & passive liveness, anti-spoofing, and multi-angle facial motion.
     */
    evaluateLiveness(selfiePayload?: string): InHouseBiometricResult["liveness"];
    /**
     * Performs 1:1 facial biometric matching between the ID card photo and selfie.
     */
    compareFaces(idPhotoPayload?: string, selfiePayload?: string, customThreshold?: number): Promise<InHouseBiometricResult>;
}
