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
export class PeriodicRescreeningManager {
  constructor(private readonly sanctionsClient: SanctionsScreeningClient) {}

  /**
   * Evaluates a batch of existing customers against the latest watchlist data.
   */
  async runBatchRescreening(targets: RescreeningTarget[]): Promise<RescreeningReport> {
    const report: RescreeningReport = {
      totalScreened: targets.length,
      newHits: 0,
      flaggedForReview: 0,
      cleared: 0,
      results: [],
    };

    for (const target of targets) {
      const checkResult = await this.sanctionsClient.screen(target.identity);

      let newStatus: "CLEARED" | "FLAGGED" | "BLOCKED" = "CLEARED";
      if (!checkResult.pass) {
        newStatus = "BLOCKED";
        report.newHits++;
      } else if (checkResult.flaggedForReview) {
        newStatus = "FLAGGED";
        report.flaggedForReview++;
      } else {
        report.cleared++;
      }

      report.results.push({
        userId: target.userId,
        previousStatus: target.status,
        newStatus,
        checkResult,
      });
    }

    return report;
  }
}
