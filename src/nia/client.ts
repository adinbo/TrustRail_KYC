import type { IdentityCheckResult, IdentityInput } from "../types.js";

/**
 * NIA (Ghana's National Identification Authority) registry check — confirms
 * a Ghana Card is genuinely valid and its ID number/name/DOB match the
 * National Identity Register. This is a registry lookup, not a biometric
 * check (see the Smile ID client for that half).
 *
 * No public sandbox exists — onboarding is an enterprise process (request
 * form to idverification@nia.gov.gh, documents, a scoping meeting, a
 * contract; see PLAN.md and the KYC module in TrustRail-Documentation.docx
 * for the full steps). Until that's done, MockNiaClient stands in behind
 * this same interface, so swapping in the real thing later is a plug-in,
 * not a redesign — same pattern as CediRamp's own AmlScreeningClient seam
 * (src/adapters/aml.live.ts in the CediRamp repo).
 */
export interface NiaClient {
  verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
}

/**
 * Stands in for the real NIA registry check until that onboarding is done.
 * Deterministic on the ID number so tests are repeatable: any ID number
 * starting with "0" is treated as a registry mismatch (for exercising the
 * failure path); everything else passes. This is a testing convenience,
 * not a real rule — replace entirely once the real client exists.
 */
export class MockNiaClient implements NiaClient {
  async verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult> {
    const isMockFailure =
      input.idNumber.startsWith("0") ||
      input.idNumber.toUpperCase().startsWith("GHA-0") ||
      input.idNumber.includes("000000000") ||
      input.lastName.toLowerCase().includes("fail") ||
      input.lastName.toLowerCase().includes("dangerfield");

    const registryMatch = !isMockFailure;
    return {
      source: "nia",
      pass: registryMatch,
      detail: registryMatch
        ? { note: "mock: registry match" }
        : { note: "mock: no registry match for this ID number (simulated mismatch)" },
    };
  }
}
