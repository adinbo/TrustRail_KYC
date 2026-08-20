import type { IdentityCheckResult, IdentityInput } from "../types.js";
/**
 * Real integration against Smile ID's sandbox API — verified directly
 * against their official SDK source (smileidentity/smile-identity-core-js
 * on GitHub) for the signature scheme, base URLs, and request/response
 * shapes.
 *
 * Supports:
 * - job_type 5 (Enhanced KYC / Registry text matching)
 * - job_type 1 (Biometric KYC with selfie face-match & liveness)
 * - job_type 6 (Document Verification with card front/back photos)
 */
export interface SmileIdentityConfig {
    partnerId: string;
    apiKey: string;
    /** "0" = sandbox, "1" = production. Always "0" until this module and
     *  CediRamp are both production-ready. */
    server: "0" | "1";
    /** ISO 3166 alpha-2 country code. Defaults to "GH". */
    country?: string;
    /** Smile ID's id_type string for a Ghana Card. */
    idType?: string;
}
export interface SmileClient {
    verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
}
export declare class SmileIdentityClient implements SmileClient {
    private readonly idApi;
    private readonly webApi;
    private readonly country;
    private readonly idType;
    constructor(config: SmileIdentityConfig);
    verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
}
