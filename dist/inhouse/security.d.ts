import type { IdentityInput } from "../types.js";
import type { InHouseOcrResult, InHouseTamperResult } from "./types.js";
/**
 * In-House Document Security & Anti-Tamper Analyzer.
 * Checks for physical and digital image tampering, compression anomalies,
 * and inconsistencies between submitted data and OCR extractions.
 */
export declare class InHouseSecurityAnalyzer {
    private readonly maxTamperThreshold;
    constructor(options?: {
        maxTamperThreshold?: number;
    });
    /**
     * Analyzes document images and OCR results for tampering and fraud signals.
     */
    analyzeDocument(input: IdentityInput, ocr: InHouseOcrResult): InHouseTamperResult;
}
