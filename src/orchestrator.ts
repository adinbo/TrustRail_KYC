import type { NiaClient } from "./nia/client.js";
import type { SanctionsScreeningClient } from "./sanctions/client.js";
import type { IdentityInput, IdentityVerificationResult, IdVerificationClient } from "./types.js";

/**
 * Runs the NIA registry check and a biometric/registry identity vendor
 * check in parallel (both required to pass), then sanctions screening. All
 * three checks always run and their results are all returned — even once
 * one fails — so a partner/ops reviewer sees the whole picture, not just
 * the first failure.
 *
 * The vendor slot takes any IdVerificationClient — Smile ID and QoreID
 * both satisfy it today (see src/smile/client.ts and src/qoreid/client.ts);
 * which one gets built is a config decision made in index.ts, not here.
 */
export class IdentityOrchestrator {
  constructor(
    private readonly nia: NiaClient,
    private readonly idVerification: IdVerificationClient,
    private readonly sanctions: SanctionsScreeningClient,
  ) {}

  async verify(input: IdentityInput): Promise<IdentityVerificationResult> {
    const [niaResult, vendorResult, sanctionsResult] = await Promise.all([
      this.nia.verifyIdentity(input),
      this.idVerification.verifyIdentity(input),
      this.sanctions.screen(input),
    ]);
    const checks = [niaResult, vendorResult, sanctionsResult];
    return { verified: checks.every((c) => c.pass), checks };
  }
}
