import { describe, it, expect } from "vitest";
import { MockNiaClient } from "../src/nia/client.js";
import { MockSanctionsClient } from "../src/sanctions/client.js";
import { IdentityOrchestrator } from "../src/orchestrator.js";
import type { IdentityInput, IdentityCheckResult, IdVerificationClient } from "../src/types.js";

const baseInput: IdentityInput = {
  firstName: "Ama",
  lastName: "Mensah",
  idNumber: "GHA-123456789-0",
  dateOfBirth: "1990-01-01",
  externalRef: "user-1",
};

/** A test double satisfying IdVerificationClient — proves the orchestrator
 *  accepts anything shaped like the interface, not just a real vendor
 *  client (Smile ID or QoreID). */
function fakeIdVendorClient(pass: boolean): IdVerificationClient {
  return {
    async verifyIdentity(): Promise<IdentityCheckResult> {
      return { source: "smile", pass, detail: { note: "test double" } };
    },
  };
}

describe("IdentityOrchestrator", () => {
  it("verified=true only when all three checks pass", async () => {
    const orch = new IdentityOrchestrator(new MockNiaClient(), fakeIdVendorClient(true), new MockSanctionsClient());
    const result = await orch.verify(baseInput);
    expect(result.verified).toBe(true);
    expect(result.checks).toHaveLength(3);
    expect(result.checks.map((c) => c.source).sort()).toEqual(["nia", "sanctions", "smile"]);
  });

  it("verified=false when NIA fails, even if the vendor check passes", async () => {
    const orch = new IdentityOrchestrator(new MockNiaClient(), fakeIdVendorClient(true), new MockSanctionsClient());
    const result = await orch.verify({ ...baseInput, idNumber: "0999999" }); // triggers the mock's failure path
    expect(result.verified).toBe(false);
    const nia = result.checks.find((c) => c.source === "nia");
    expect(nia?.pass).toBe(false);
  });

  it("verified=false when the vendor check fails, even if NIA passes", async () => {
    const orch = new IdentityOrchestrator(new MockNiaClient(), fakeIdVendorClient(false), new MockSanctionsClient());
    const result = await orch.verify(baseInput);
    expect(result.verified).toBe(false);
  });

  it("returns all three check results even when one fails (nothing short-circuits)", async () => {
    const orch = new IdentityOrchestrator(new MockNiaClient(), fakeIdVendorClient(false), new MockSanctionsClient());
    const result = await orch.verify(baseInput);
    expect(result.checks).toHaveLength(3);
  });
});
