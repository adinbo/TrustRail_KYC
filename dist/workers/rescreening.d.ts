import type { SanctionsScreeningClient } from "../sanctions/client.js";
import type { IdentityCheckResult, IdentityInput } from "../types.js";
export interface RescreeningTarget {
    userId: string;
    identity: IdentityInput;
    lastScreenedAt: Date;
    status: "CLEARED" | "FLAGGED" | "BLOCKED";
}
export interface RescreeningReport {
    totalScreened: number;
    newHits: number;
    flaggedForReview: number;
    cleared: number;
    results: Array<{
        userId: string;
        previousStatus: string;
        newStatus: string;
        checkResult: IdentityCheckResult;
    }>;
}
/**
 * Ongoing Compliance & Periodic Re-Screening Worker
 * Periodically screens existing verified customers against updated international sanctions
 * and PEP watchlists (e.g. every 30-90 days or batch on-demand).
 */
export declare class PeriodicRescreeningManager {
    private readonly sanctionsClient;
    constructor(sanctionsClient: SanctionsScreeningClient);
    /**
     * Evaluates a batch of existing customers against the latest watchlist data.
     */
    runBatchRescreening(targets: RescreeningTarget[]): Promise<RescreeningReport>;
}
