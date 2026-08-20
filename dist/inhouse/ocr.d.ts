import type { IdentityInput } from "../types.js";
import type { InHouseOcrResult } from "./types.js";
/**
 * Standard ICAO Doc 9303 MRZ parser for TD1 (Identity Cards, 3 lines of 30 chars)
 * and TD3 (Passports, 2 lines of 44 chars).
 */
export declare function parseMrz(lines: string[]): {
    validChecksum: boolean;
    docCode?: string;
    issuer?: string;
    docNumber?: string;
    dob?: string;
    expiry?: string;
    gender?: "M" | "F" | "OTHER";
    lastName?: string;
    firstName?: string;
};
/**
 * In-House Document OCR Engine.
 * Extracts fields from visual text zones, MRZ barcodes, and structured image data.
 */
export declare class InHouseOcrEngine {
    /**
     * Processes identity input (images + raw metadata) and extracts normalized document fields.
     */
    extractDocumentData(input: IdentityInput): Promise<InHouseOcrResult>;
}
