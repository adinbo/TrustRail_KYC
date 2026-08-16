import { describe, it, expect } from "vitest";
import { QoreIDClient } from "../src/qoreid/client.js";

// Real API test — only runs when real credentials are present in the
// environment (never in CI without them, never by accident). Sign up for a
// QoreID account and set QOREID_CLIENT_ID/QOREID_CLIENT_SECRET to actually
// exercise this. See PLAN.md and README.md. Unlike Smile ID, QoreID's docs
// don't describe a canned sandbox test-ID table — confirm on the QoreID
// dashboard which ID number, if any, is safe to call repeatedly before
// relying on this test in an automated suite.
const hasCreds = Boolean(process.env.QOREID_CLIENT_ID && process.env.QOREID_CLIENT_SECRET);

describe.skipIf(!hasCreds)("QoreIDClient (real API — needs credentials)", () => {
  it("returns a check result shape from a real call", async () => {
    const client = new QoreIDClient({
      clientId: process.env.QOREID_CLIENT_ID!,
      secret: process.env.QOREID_CLIENT_SECRET!,
      baseUrl: process.env.QOREID_BASE_URL,
    });
    const result = await client.verifyIdentity({
      firstName: "Test",
      lastName: "User",
      idNumber: process.env.QOREID_TEST_ID_NUMBER ?? "GHA-000000000-0",
      dateOfBirth: "1990-01-01",
      externalRef: `trustrail-smoke-${Date.now()}`,
    });
    expect(result.source).toBe("qoreid");
    expect(typeof result.pass).toBe("boolean");
    // Deliberately not asserting pass === true — see the comment above on
    // why a specific ID number isn't assumed to be safe/valid here.
  });
});

if (!hasCreds) {
  describe("QoreIDClient (real API)", () => {
    it.skip("skipped — set QOREID_CLIENT_ID and QOREID_CLIENT_SECRET to run this for real", () => {});
  });
}
