import type { NiaClient } from "./nia/client.js";
import type { SanctionsScreeningClient } from "./sanctions/client.js";
import type { AddressVerificationClient } from "./address/ghanapost.js";
import type { IdentityInput, IdentityVerificationResult, IdVerificationClient } from "./types.js";
/**
 * Orchestrates multi-layered identity verification:
 * 1. Document expiry validation
 * 2. Authoritative registry check (NIA)
 * 3. Biometric / vendor ID verification (Smile ID / QoreID)
 * 4. Sanctions & PEP screening (OpenSanctions)
 * 5. Optional Proof of Address check (GhanaPost GPS)
 */
export declare class IdentityOrchestrator {
    private readonly nia;
    private readonly idVerification;
    private readonly sanctions;
    private readonly addressVerifier?;
    constructor(nia: NiaClient, idVerification: IdVerificationClient, sanctions: SanctionsScreeningClient, addressVerifier?: AddressVerificationClient | undefined);
    verify(input: IdentityInput): Promise<IdentityVerificationResult>;
}
