import { describe, it, expect } from "vitest";
import { OpenSanctionsClient } from "../src/sanctions/opensanctions.js";

// Real API test — only runs when a real API key is present in the
// environment (never in CI without it, never by accident). Sign up at
// opensanctions.org and set OPENSANCTIONS_API_KEY to actually exercise
// this. See PLAN.md and README.md.
const hasCreds = Boolean(process.env.OPENSANCTIONS_API_KEY);

describe.skipIf(!hasCreds)("OpenSanctionsClient (real API — needs credentials)", () => {
  it("flags a well-known sanctioned/PEP name as a hit", async () => {
    const client = new OpenSanctionsClient({ apiKey: process.env.OPENSANCTIONS_API_KEY! });
    // Vladimir Putin is present on essentially every sanctions dataset —
    // a stable, real positive-match case, not a synthetic test identity
    // (OpenSanctions doesn't publish one the way Smile ID does).
    const result = await client.screen({
      firstName: "Vladimir",
      lastName: "Putin",
      idNumber: "n/a",
      dateOfBirth: "1952-10-07",
      externalRef: "trustrail-smoke-sanctions-hit",
    });
    expect(result.source).toBe("sanctions");
    expect(result.pass).toBe(false);
  });

  it("clears an unremarkable name with no watchlist match", async () => {
    const client = new OpenSanctionsClient({ apiKey: process.env.OPENSANCTIONS_API_KEY! });
    const result = await client.screen({
      firstName: "Kwame",
      lastName: "Asantewaakobiri",
      idNumber: "n/a",
      dateOfBirth: "1994-03-11",
      externalRef: "trustrail-smoke-sanctions-clear",
    });
    expect(result.source).toBe("sanctions");
    expect(result.pass).toBe(true);
  });
});

if (!hasCreds) {
  describe("OpenSanctionsClient (real API)", () => {
    it.skip("skipped — set OPENSANCTIONS_API_KEY to run this for real", () => {});
  });
}
