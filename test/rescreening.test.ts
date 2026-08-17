import { describe, expect, it } from "vitest";
import { PeriodicRescreeningManager, type RescreeningTarget } from "../src/workers/rescreening.js";
import type { SanctionsScreeningClient } from "../src/sanctions/client.js";
import type { IdentityCheckResult, IdentityInput } from "../src/types.js";

describe("Periodic Re-Screening Manager", () => {
  const mockSanctionsClient: SanctionsScreeningClient = {
    async screen(input: IdentityInput): Promise<IdentityCheckResult> {
      if (input.lastName.toLowerCase().includes("sanctioned")) {
        return {
          source: "sanctions",
          pass: false,
          riskCategory: "SANCTION",
          detail: { note: "Sanction match detected" },
        };
      }
      if (input.lastName.toLowerCase().includes("minister")) {
        return {
          source: "sanctions",
          pass: true,
          flaggedForReview: true,
          riskCategory: "PEP",
          detail: { note: "Politically Exposed Person flagged" },
        };
      }
      return {
        source: "sanctions",
        pass: true,
        riskCategory: "CLEAR",
        detail: { note: "Clear" },
      };
    },
  };

  const manager = new PeriodicRescreeningManager(mockSanctionsClient);

  it("runs batch re-screening and accurately tallies new hits vs PEP flags vs cleared", async () => {
    const targets: RescreeningTarget[] = [
      {
        userId: "usr-1",
        identity: {
          firstName: "John",
          lastName: "Doe",
          idNumber: "GHA-123456789-0",
          dateOfBirth: "1990-01-01",
          externalRef: "usr-1",
        },
        lastScreenedAt: new Date(Date.now() - 30 * 86400000),
        status: "CLEARED",
      },
      {
        userId: "usr-2",
        identity: {
          firstName: "Bad",
          lastName: "SanctionedActor",
          idNumber: "GHA-987654321-0",
          dateOfBirth: "1985-05-05",
          externalRef: "usr-2",
        },
        lastScreenedAt: new Date(Date.now() - 60 * 86400000),
        status: "CLEARED",
      },
      {
        userId: "usr-3",
        identity: {
          firstName: "Honorable",
          lastName: "MinisterKofi",
          idNumber: "GHA-555555555-5",
          dateOfBirth: "1975-03-15",
          externalRef: "usr-3",
        },
        lastScreenedAt: new Date(Date.now() - 90 * 86400000),
        status: "CLEARED",
      },
    ];

    const report = await manager.runBatchRescreening(targets);

    expect(report.totalScreened).toBe(3);
    expect(report.cleared).toBe(1);
    expect(report.newHits).toBe(1);
    expect(report.flaggedForReview).toBe(1);

    expect(report.results.find((r) => r.userId === "usr-2")?.newStatus).toBe("BLOCKED");
    expect(report.results.find((r) => r.userId === "usr-3")?.newStatus).toBe("FLAGGED");
    expect(report.results.find((r) => r.userId === "usr-1")?.newStatus).toBe("CLEARED");
  });
});
