export interface VelocityRecord {
    idNumber: string;
    externalRef: string;
    ipAddress?: string;
    timestamp: number;
}
export interface VelocityCheckResult {
    passed: boolean;
    attemptCount: number;
    duplicateAccountsDetected: string[];
    flags: string[];
}
/**
 * In-House Velocity Tracker and Sybil Multi-Account Detector.
 * Prevents credential stuffing, rapid retries, and multi-user Ghana Card reuse.
 */
export declare class InHouseVelocityTracker {
    private records;
    private readonly maxAttemptsPerWindow;
    private readonly windowMs;
    constructor(options?: {
        maxAttemptsPerWindow?: number;
        windowMinutes?: number;
    });
    /**
     * Cleans records older than windowMs.
     */
    private prune;
    /**
     * Records an attempt and evaluates velocity / duplicate risk.
     */
    evaluateAndRecord(idNumber?: string, externalRef?: string, ipAddress?: string): VelocityCheckResult;
    /**
     * Resets all history (useful for testing).
     */
    clear(): void;
}
