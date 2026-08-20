/**
 * In-House Velocity Tracker and Sybil Multi-Account Detector.
 * Prevents credential stuffing, rapid retries, and multi-user Ghana Card reuse.
 */
export class InHouseVelocityTracker {
    records = [];
    maxAttemptsPerWindow;
    windowMs;
    constructor(options) {
        this.maxAttemptsPerWindow = options?.maxAttemptsPerWindow ?? 5;
        this.windowMs = (options?.windowMinutes ?? 10) * 60 * 1000;
    }
    /**
     * Cleans records older than windowMs.
     */
    prune() {
        const cutoff = Date.now() - this.windowMs;
        this.records = this.records.filter((r) => r.timestamp >= cutoff);
    }
    /**
     * Records an attempt and evaluates velocity / duplicate risk.
     */
    evaluateAndRecord(idNumber, externalRef, ipAddress) {
        this.prune();
        const flags = [];
        if (!idNumber) {
            return {
                passed: true,
                attemptCount: 0,
                duplicateAccountsDetected: [],
                flags: [],
            };
        }
        const normId = idNumber.trim().toUpperCase();
        const normRef = (externalRef || "anon").trim();
        // Check existing records for this ID number
        const matchingRecords = this.records.filter((r) => r.idNumber === normId);
        const distinctUsers = Array.from(new Set(matchingRecords.map((r) => r.externalRef))).filter((ref) => ref !== normRef);
        // Multi-Account Duplicate Abuse
        if (distinctUsers.length > 0) {
            flags.push(`DUPLICATE_ID_MULTI_ACCOUNT_ALERT: Ghana Card ${idNumber} has already been registered by account(s): ${distinctUsers.join(", ")}`);
        }
        // Velocity Burst Throttling
        const recentAttemptsForId = matchingRecords.length;
        if (recentAttemptsForId >= this.maxAttemptsPerWindow) {
            flags.push(`VELOCITY_RATE_LIMIT_EXCEEDED: Exceeded max allowed attempts (${this.maxAttemptsPerWindow}) within 10 minutes for ID ${idNumber}`);
        }
        // Record this attempt
        this.records.push({
            idNumber: normId,
            externalRef: normRef,
            ipAddress,
            timestamp: Date.now(),
        });
        const passed = flags.length === 0;
        return {
            passed,
            attemptCount: recentAttemptsForId + 1,
            duplicateAccountsDetected: distinctUsers,
            flags,
        };
    }
    /**
     * Resets all history (useful for testing).
     */
    clear() {
        this.records = [];
    }
}
//# sourceMappingURL=registry.js.map