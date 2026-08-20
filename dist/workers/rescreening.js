/**
 * Ongoing Compliance & Periodic Re-Screening Worker
 * Periodically screens existing verified customers against updated international sanctions
 * and PEP watchlists (e.g. every 30-90 days or batch on-demand).
 */
export class PeriodicRescreeningManager {
    sanctionsClient;
    constructor(sanctionsClient) {
        this.sanctionsClient = sanctionsClient;
    }
    /**
     * Evaluates a batch of existing customers against the latest watchlist data.
     */
    async runBatchRescreening(targets) {
        const report = {
            totalScreened: targets.length,
            newHits: 0,
            flaggedForReview: 0,
            cleared: 0,
            results: [],
        };
        for (const target of targets) {
            const checkResult = await this.sanctionsClient.screen(target.identity);
            let newStatus = "CLEARED";
            if (!checkResult.pass) {
                newStatus = "BLOCKED";
                report.newHits++;
            }
            else if (checkResult.flaggedForReview) {
                newStatus = "FLAGGED";
                report.flaggedForReview++;
            }
            else {
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
//# sourceMappingURL=rescreening.js.map