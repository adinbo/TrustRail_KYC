import type { InHouseQualityResult } from "./types.js";
/**
 * Pre-Flight Image Quality Analyzer for In-House KYC.
 * Evaluates blur (Laplacian variance), exposure / lighting bounds, and glare.
 */
export declare class InHouseQualityAnalyzer {
    private readonly minSharpness;
    private readonly minIllumination;
    private readonly maxGlare;
    constructor(options?: {
        minSharpness?: number;
        minIllumination?: number;
        maxGlare?: number;
    });
    /**
     * Evaluates quality metrics of a captured image base64 stream.
     */
    evaluateQuality(imageBase64?: string, label?: string): InHouseQualityResult;
}
