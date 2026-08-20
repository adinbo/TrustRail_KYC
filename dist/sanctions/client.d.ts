import type { IdentityCheckResult, IdentityInput } from "../types.js";
/**
 * Sanctions/PEP screening — scaffolded this pass, not wired to a real
 * vendor yet (deferred per the stated build priority: identity first,
 * sanctions screening next). Mirrors CediRamp's own AmlScreeningClient
 * seam (src/adapters/aml.live.ts) deliberately, so whichever vendor gets
 * picked (ComplyAdvantage, Refinitiv World-Check, or a bundled offering
 * from the KYC vendor) plugs into the same shape either codebase expects.
 */
export interface SanctionsScreeningClient {
    screen(input: IdentityInput): Promise<IdentityCheckResult>;
}
/** Placeholder — always passes. Replace with a real vendor integration in
 *  the next pass; do not rely on this for anything beyond exercising the
 *  orchestrator's plumbing. */
export declare class MockSanctionsClient implements SanctionsScreeningClient {
    screen(_input: IdentityInput): Promise<IdentityCheckResult>;
}
