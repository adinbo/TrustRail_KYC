import { MockNiaClient } from "./nia/client.js";
import { SmileIdentityClient } from "./smile/client.js";
import { QoreIDClient } from "./qoreid/client.js";
import { MockIdVerificationClient } from "./mock/idVerification.js";
import { MockSanctionsClient } from "./sanctions/client.js";
import { OpenSanctionsClient } from "./sanctions/opensanctions.js";
import { MockGhanaPostClient } from "./address/ghanapost.js";
import { InHouseIdentityClient } from "./inhouse/client.js";
import { IdentityOrchestrator } from "./orchestrator.js";
export { MockNiaClient } from "./nia/client.js";
export { SmileIdentityClient } from "./smile/client.js";
export { QoreIDClient } from "./qoreid/client.js";
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
export { OpenSanctionsClient } from "./sanctions/opensanctions.js";
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
export function buildOrchestratorFromEnv() {
    const vendor = (process.env.KYC_VENDOR ?? "inhouse").toLowerCase();
    let idVerification;
    if (vendor === "inhouse" || vendor === "standalone") {
        const faceMatchThreshold = process.env.INHOUSE_MATCH_THRESHOLD ? parseFloat(process.env.INHOUSE_MATCH_THRESHOLD) : undefined;
        const livenessThreshold = process.env.INHOUSE_LIVENESS_THRESHOLD ? parseFloat(process.env.INHOUSE_LIVENESS_THRESHOLD) : undefined;
        const maxTamperThreshold = process.env.INHOUSE_TAMPER_THRESHOLD ? parseFloat(process.env.INHOUSE_TAMPER_THRESHOLD) : undefined;
        const enforceTamperCheck = process.env.INHOUSE_ENFORCE_TAMPER === "true";
        idVerification = new InHouseIdentityClient({
            faceMatchThreshold,
            livenessThreshold,
            maxTamperThreshold,
            enforceTamperCheck,
        });
    }
    else if (vendor === "smile") {
        const partnerId = process.env.SMILE_PARTNER_ID;
        const apiKey = process.env.SMILE_API_KEY;
        const server = (process.env.SMILE_SERVER ?? "0");
        if (!partnerId || !apiKey) {
            throw new Error("Missing SMILE_PARTNER_ID / SMILE_API_KEY. Sign up for a free Smile ID sandbox account " +
                "and set both in .env — see .env.example. (Or set KYC_VENDOR=inhouse/mock instead.)");
        }
        idVerification = new SmileIdentityClient({ partnerId, apiKey, server });
    }
    else if (vendor === "qoreid") {
        const clientId = process.env.QOREID_CLIENT_ID;
        const secret = process.env.QOREID_CLIENT_SECRET;
        if (!clientId || !secret) {
            throw new Error("Missing QOREID_CLIENT_ID / QOREID_CLIENT_SECRET. Sign up for a QoreID account and set " +
                "both in .env — see .env.example. (Or set KYC_VENDOR=inhouse/mock instead.)");
        }
        idVerification = new QoreIDClient({ clientId, secret, baseUrl: process.env.QOREID_BASE_URL });
    }
    else if (vendor === "mock") {
        idVerification = new MockIdVerificationClient();
    }
    else {
        throw new Error(`Unknown KYC_VENDOR "${vendor}" — expected "inhouse", "smile", "qoreid", or "mock".`);
    }
    const sanctionsMode = (process.env.SANCTIONS_MODE ?? "mock").toLowerCase();
    let sanctions;
    if (sanctionsMode === "opensanctions") {
        const apiKey = process.env.OPENSANCTIONS_API_KEY;
        if (!apiKey) {
            throw new Error("Missing OPENSANCTIONS_API_KEY. Sign up at opensanctions.org and set it in .env — " +
                "see .env.example. (Or set SANCTIONS_MODE=mock to skip real screening for now.)");
        }
        sanctions = new OpenSanctionsClient({ apiKey, baseUrl: process.env.OPENSANCTIONS_BASE_URL });
    }
    else if (sanctionsMode === "mock") {
        sanctions = new MockSanctionsClient();
    }
    else {
        throw new Error(`Unknown SANCTIONS_MODE "${sanctionsMode}" — expected "mock" or "opensanctions".`);
    }
    const addressVerifier = new MockGhanaPostClient();
    return new IdentityOrchestrator(new MockNiaClient(), idVerification, sanctions, addressVerifier);
}
//# sourceMappingURL=index.js.map