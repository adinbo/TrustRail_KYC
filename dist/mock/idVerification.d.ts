import type { IdentityCheckResult, IdentityInput, IdVerificationClient } from "../types.js";
/**
 * Stands in for a real biometric/registry identity vendor (Smile ID /
 * QoreID) when neither can actually be exercised — added 2026-08-16 after
 * QoreID's Ghana Card product couldn't produce a genuine `verified: true`
 * result with any data tried (real Ghana Card included — see
 * PLAN.md's "QoreID integration" section for the full trail) and their
 * Nigeria NIN product 403'd even after subscribing. This unblocks testing
 * the rest of the pipeline (Mmabia's funding flow, CediRamp's kyc-method
 * gate, etc.) without depending on a vendor issue outside this project's
 * control.
 *
 * Selected via `KYC_VENDOR=mock` — see index.ts's buildOrchestratorFromEnv().
 * Deterministic on the ID number (same convention as MockNiaClient), not a
 * blind always-pass: any ID number starting with "0" fails, so the
 * rejection path stays exercisable without a real vendor either. This is a
 * testing convenience, not a real rule — swap KYC_VENDOR back to "qoreid"
 * or "smile" once a real vendor path actually works, or before anything
 * resembling production use.
 */
export declare class MockIdVerificationClient implements IdVerificationClient {
    verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
}
