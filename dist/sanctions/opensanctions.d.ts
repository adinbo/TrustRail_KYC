import type { IdentityCheckResult, IdentityInput } from "../types.js";
import type { SanctionsScreeningClient } from "./client.js";
/**
 * Real integration against OpenSanctions' matching API — the open, largely
 * self-hostable database of sanctions lists, PEPs, and other watchlists.
 * Chosen over Smile ID's bundled AML Check (same gmail signup wall as its
 * identity product) and over QoreID (no documented watchlist/PEP endpoint).
 *
 * Verified directly from OpenSanctions' own official examples repo
 * (github.com/opensanctions/api-examples — curl/README.md and
 * node-js/match_name_birth_date.js), not the docs site alone, since one
 * docs page's prose ("Authorization: ApiKey xxx") didn't match what their
 * own working examples actually send (`Authorization: <raw key>`, no
 * "ApiKey" prefix) — the examples repo was treated as the more trustworthy
 * source when the two disagreed.
 *
 * - `POST {baseUrl}/match/{dataset}` — `dataset` defaults to "default",
 *   which bundles sanctions + PEP + other watchlists together.
 * - Header: `Authorization: <apiKey>` (no scheme prefix).
 * - Body: `{ queries: { q1: { schema: "Person", properties: { name, birthDate,
 *   country } } } }` — properties take arrays (multiple name variants etc).
 * - Response: `responses.q1.results[]`, each a FollowTheMoney entity with
 *   `id`, `properties`, `match` (boolean — OpenSanctions' own thresholded
 *   decision), `score`, and `features`. Only fields the official example
 *   actually reads (`id`, `properties.name`, `match`, `score`, `features`)
 *   are relied on here — other commonly-assumed fields like `caption` or
 *   `datasets` weren't confirmed against a real payload and are
 *   deliberately not used.
 *
 * NOT verified this pass: whether signup accepts a gmail.com address (their
 * docs don't mention a restriction either way, unlike Smile ID's explicit
 * one) — untested since this wasn't the vendor that hit that wall.
 */
export interface OpenSanctionsConfig {
    apiKey: string;
    /** Defaults to OpenSanctions' production host — they don't document a
     *  separate sandbox host; the free trial key operates on this same API. */
    baseUrl?: string;
    /** Defaults to "default" — the combined sanctions+PEP+watchlist dataset. */
    dataset?: string;
    /** ISO 3166 alpha-2 country hint to improve match precision. Defaults to
     *  "GH" — TrustRail-KYC is Ghana-focused this pass. */
    country?: string;
    /** Request timeout in milliseconds. Defaults to 15,000 ms. */
    timeoutMs?: number;
}
export declare class OpenSanctionsClient implements SanctionsScreeningClient {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly dataset;
    private readonly country;
    private readonly timeoutMs;
    constructor(config: OpenSanctionsConfig);
    screen(input: IdentityInput): Promise<IdentityCheckResult>;
}
