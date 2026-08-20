import { IdentityOrchestrator } from "./orchestrator.js";
export type { IdentityInput, IdentityCheckResult, IdentityVerificationResult, IdVerificationClient, } from "./types.js";
export { MockNiaClient } from "./nia/client.js";
export type { NiaClient } from "./nia/client.js";
export { SmileIdentityClient } from "./smile/client.js";
export type { SmileIdentityConfig, SmileClient } from "./smile/client.js";
export { QoreIDClient } from "./qoreid/client.js";
export type { QoreIDConfig } from "./qoreid/client.js";
export { InHouseIdentityClient } from "./inhouse/client.js";
export * from "./inhouse/types.js";
export * from "./inhouse/ocr.js";
export * from "./inhouse/biometrics.js";
export * from "./inhouse/security.js";
export * from "./inhouse/quality.js";
export * from "./inhouse/certificate.js";
export * from "./inhouse/registry.js";
export { MockIdVerificationClient } from "./mock/idVerification.js";
export { MockSanctionsClient } from "./sanctions/client.js";
export type { SanctionsScreeningClient } from "./sanctions/client.js";
export { OpenSanctionsClient } from "./sanctions/opensanctions.js";
export type { OpenSanctionsConfig } from "./sanctions/opensanctions.js";
export { IdentityOrchestrator } from "./orchestrator.js";
export * from "./validation.js";
export * from "./utils/masking.js";
export * from "./adapter/cediramp.js";
export * from "./address/ghanapost.js";
export * from "./webhooks/receiver.js";
export * from "./workers/rescreening.js";
/** Builds an orchestrator from environment variables — see .env.example.
 *  KYC_VENDOR picks which identity vendor fills the IdVerificationClient
 *  slot ("inhouse", "smile", "qoreid", or "mock"; default "inhouse").
 */
export declare function buildOrchestratorFromEnv(): IdentityOrchestrator;
