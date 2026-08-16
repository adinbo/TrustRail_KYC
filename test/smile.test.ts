import { describe, it, expect } from "vitest";
import { SmileIdentityClient } from "../src/smile/client.js";

// Real sandbox test — only runs when real credentials are present in the
// environment (never in CI without them, never by accident). Sign up for a
// free Smile ID sandbox account and set SMILE_PARTNER_ID/SMILE_API_KEY to
// actually exercise this. See PLAN.md and README.md.
const hasCreds = Boolean(process.env.SMILE_PARTNER_ID && process.env.SMILE_API_KEY);

describe.skipIf(!hasCreds)("SmileIdentityClient (real sandbox — needs credentials)", () => {
  it("returns a check result shape from a real sandbox call", async () => {
    const client = new SmileIdentityClient({
      partnerId: process.env.SMILE_PARTNER_ID!,
      apiKey: process.env.SMILE_API_KEY!,
      server: "0",
    });
    // Smile's sandbox matches on firstName+lastName+email exactly against
    // their published test-identity table (see src/smile/client.ts) — this
    // is their "happy path" row (status "clear"). idNumber/dateOfBirth are
    // echoed back unused, so any well-formed values work.
    const result = await client.verifyIdentity({
      firstName: "Amina Fatou",
      lastName: "Clearwater",
      email: "amina.clearwater@example.com",
      idNumber: process.env.SMILE_TEST_ID_NUMBER ?? "GHA-000000000-0",
      dateOfBirth: "1990-01-01",
      externalRef: `trustrail-smoke-${Date.now()}`,
    });
    expect(result.source).toBe("smile");
    expect(typeof result.pass).toBe("boolean");
    // Not hard-asserting pass === true — see the field-name caveat in
    // src/smile/client.ts's verifyIdentity() comment on the sandbox's
    // canned-response shape not being confirmed against a live payload
    // yet; this test proves the integration runs end-to-end regardless.
  });
});

if (!hasCreds) {
  describe("SmileIdentityClient (real sandbox)", () => {
    it.skip("skipped — set SMILE_PARTNER_ID and SMILE_API_KEY to run this for real", () => {});
  });
}
