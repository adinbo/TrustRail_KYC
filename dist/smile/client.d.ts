import type { IdentityCheckResult, IdentityInput } from "../types.js";
/**
 * Native REST integration against Smile ID's API (no buggy third-party SDK dependencies).
 * Uses standard HMAC-SHA256 signature scheme against Smile ID v1 endpoints.
 *
 * Supports:
 * - job_type 5 (Enhanced KYC / Registry text matching)
 * - job_type 1 (Biometric KYC with selfie face-match & liveness)
 * - job_type 6 (Document Verification with card front/back photos)
 */
export interface SmileIdentityConfig {
    partnerId: string;
    apiKey: string;
    /** "0" = sandbox, "1" = production. Defaults to "0" (sandbox). */
    server?: "0" | "1";
    /** Base URL override if needed. */
    baseUrl?: string;
    /** ISO 3166 alpha-2 country code. Defaults to "GH". */
    country?: string;
    /** Smile ID's id_type string for a Ghana Card. */
    idType?: string;
}
export interface SmileClient {
    verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
}
export declare class SmileIdentityClient implements SmileClient {
    private readonly partnerId;
    private readonly apiKey;
    private readonly baseUrl;
    private readonly country;
    private readonly idType;
    constructor(config: SmileIdentityConfig);
    private generateSignature;
    verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
}
