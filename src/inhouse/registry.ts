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
export class InHouseVelocityTracker {
  private records: VelocityRecord[] = [];
  private readonly maxAttemptsPerWindow: number;
  private readonly windowMs: number;

  constructor(options?: { maxAttemptsPerWindow?: number; windowMinutes?: number }) {
    this.maxAttemptsPerWindow = options?.maxAttemptsPerWindow ?? 5;
    this.windowMs = (options?.windowMinutes ?? 10) * 60 * 1000;
  }

  /**
   * Cleans records older than windowMs.
   */
  private prune(): void {
    const cutoff = Date.now() - this.windowMs;
    this.records = this.records.filter((r) => r.timestamp >= cutoff);
  }

  /**
   * Records an attempt and evaluates velocity / duplicate risk.
   */
  public evaluateAndRecord(idNumber?: string, externalRef?: string, ipAddress?: string): VelocityCheckResult {
    this.prune();
    const flags: string[] = [];

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
    const distinctUsers = Array.from(new Set(matchingRecords.map((r) => r.externalRef))).filter(
      (ref) => ref !== normRef,
    );

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
  public clear(): void {
    this.records = [];
  }
}
