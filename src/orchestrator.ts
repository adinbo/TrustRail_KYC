import type { NiaClient } from "./nia/client.js";
import type { SanctionsScreeningClient } from "./sanctions/client.js";
import type { AddressVerificationClient } from "./address/ghanapost.js";
import type {
  IdentityCheckResult,
  IdentityInput,
  IdentityVerificationResult,
  IdVerificationClient,
} from "./types.js";
import { validateDocumentExpiry } from "./validation.js";

/**
 * Orchestrates multi-layered identity verification:
 * 1. Document expiry validation
 * 2. Authoritative registry check (NIA)
 * 3. Biometric / vendor ID verification (Smile ID / QoreID)
 * 4. Sanctions & PEP screening (OpenSanctions)
 * 5. Optional Proof of Address check (GhanaPost GPS)
 */
export class IdentityOrchestrator {
  constructor(
    private readonly nia: NiaClient,
    private readonly idVerification: IdVerificationClient,
    private readonly sanctions: SanctionsScreeningClient,
    private readonly addressVerifier?: AddressVerificationClient,
  ) {}

  async verify(input: IdentityInput): Promise<IdentityVerificationResult> {
    const checks: IdentityCheckResult[] = [];

    // 1. Expiry Check (if expiryDate provided)
    if (input.expiryDate) {
      const expiry = validateDocumentExpiry(input.expiryDate);
      checks.push({
        source: "expiry",
        pass: expiry.valid,
        detail: expiry.valid
          ? { note: "Document is within validity period", expiryDate: input.expiryDate }
          : { error: expiry.error, expiryDate: input.expiryDate },
      });
    }

    // 2. Parallel Core Checks (NIA + Vendor Biometric + Sanctions + Address)
    const checkPromises: Array<Promise<IdentityCheckResult>> = [
      this.nia.verifyIdentity(input),
      this.idVerification.verifyIdentity(input),
      this.sanctions.screen(input),
    ];

    if (this.addressVerifier && input.digitalAddress) {
      checkPromises.push(this.addressVerifier.verifyAddress(input));
    }

    const parallelResults = await Promise.all(checkPromises);
    checks.push(...parallelResults);

    const verified = checks.every((c) => c.pass);
    const flaggedForReview = checks.some((c) => c.flaggedForReview);

    return {
      verified,
      flaggedForReview,
      checks,
    };
  }
}
