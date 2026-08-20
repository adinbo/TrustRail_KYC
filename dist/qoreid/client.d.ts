import type { IdentityCheckResult, IdentityInput, IdVerificationClient } from "../types.js";
/**
 * Real integration against QoreID's Ghana Card verification endpoint —
 * added as an alternative to Smile ID after Smile's signup form rejected a
 * gmail.com address. Verified directly from QoreID's own docs (not
 * guessed):
 * - Auth: POST {baseUrl}/token with { clientId, secret } (JSON body) ->
 *   { accessToken, expiresIn: "<n> secs", tokenType: "Bearer" }. Token is
 *   sent as `Authorization: Bearer <accessToken>` on subsequent calls.
 * - Verification: POST {baseUrl}/v1/gh/identities/ghana-id/{idNumber} with
 *   a JSON body of { firstname, lastname, middlename?, dob, phone?, email?,
 *   gender? }. Response includes `summary.ghana_id_check.status` (e.g.
 *   "EXACT_MATCH") and `status.status` (e.g. "verified"), plus the full
 *   registry record under `ghana_id`.
 *
 * Test vs live is a credential choice, not a host choice: QoreID's
 * dashboard issues two separate clientId/secret pairs ("Test" and "Live"),
 * both used against the same api.qoreid.com host — there's no separate
 * sandbox subdomain the way Smile ID has testapi.smileidentity.com. The
 * test-environment wallet is documented as unlimited ("allowing you to
 * test freely before moving to the live environment"), unlike live calls,
 * which are prepaid and deducted from a funded wallet.
 *
 * NOT verified this pass, and worth confirming before relying on it:
 * - Whether test-environment Ghana Card lookups return real registry data
 *   (querying NIA for real, just unmetered) or synthetic/canned data.
 *   QoreID's docs don't say, and unlike Smile ID there's no published
 *   table of named test identities to fall back on — check the QoreID
 *   dashboard directly after signup before assuming any specific ID number
 *   is safe to call repeatedly in an automated test suite (see
 *   test/qoreid.test.ts, which is skipped without real creds for exactly
 *   this reason).
 */
export interface QoreIDConfig {
    clientId: string;
    secret: string;
    /** Defaults to QoreID's production host — see the doc comment above for
     *  why there's no separate sandbox host to point at instead. */
    baseUrl?: string;
}
export declare class QoreIDClient implements IdVerificationClient {
    private readonly clientId;
    private readonly secret;
    private readonly baseUrl;
    private token;
    private readonly timeoutMs;
    constructor(config: QoreIDConfig & {
        timeoutMs?: number;
    });
    private getToken;
    verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
}
