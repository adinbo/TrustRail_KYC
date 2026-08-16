import { MockNiaClient } from "./nia/client.js";
import { SmileIdentityClient } from "./smile/client.js";
import { QoreIDClient } from "./qoreid/client.js";
import { MockIdVerificationClient } from "./mock/idVerification.js";
import { MockSanctionsClient } from "./sanctions/client.js";
import { OpenSanctionsClient } from "./sanctions/opensanctions.js";
import { IdentityOrchestrator } from "./orchestrator.js";

export type {
  IdentityInput,
  IdentityCheckResult,
  IdentityVerificationResult,
  IdVerificationClient,
} from "./types.js";
export { MockNiaClient } from "./nia/client.js";
export type { NiaClient } from "./nia/client.js";
export { SmileIdentityClient } from "./smile/client.js";
export type { SmileIdentityConfig, SmileClient } from "./smile/client.js";
export { QoreIDClient } from "./qoreid/client.js";
export type { QoreIDConfig } from "./qoreid/client.js";
export { MockIdVerificationClient } from "./mock/idVerification.js";
export { MockSanctionsClient } from "./sanctions/client.js";
export type { SanctionsScreeningClient } from "./sanctions/client.js";
export { OpenSanctionsClient } from "./sanctions/opensanctions.js";
export type { OpenSanctionsConfig } from "./sanctions/opensanctions.js";
export { IdentityOrchestrator } from "./orchestrator.js";

/** Builds an orchestrator from environment variables — see .env.example.
 *  KYC_VENDOR picks which identity vendor fills the IdVerificationClient
 *  slot ("smile", "qoreid", or "mock"; default "smile"). Real vendors are
 *  wired up since Smile ID's signup form rejects gmail.com and QoreID was
 *  added as an alternative rather than a replacement; throws a clear error
 *  if the chosen real vendor's credentials aren't set. "mock" (added
 *  2026-08-16) exists because, unlike NIA, this ISN'T a permanent gap
 *  waiting on vendor sign-up — QoreID's Ghana Card product couldn't
 *  produce a genuine verified:true with any data tried, and their NIN
 *  product 403'd even after subscribing (see PLAN.md's "QoreID
 *  integration" section) — so a deliberate, honestly-labeled mock exists
 *  to unblock testing everything downstream of identity verification
 *  without waiting on that vendor issue. Swap back to a real vendor before
 *  anything resembling production use. NIA stays mocked regardless — see
 *  PLAN.md.
 *  SANCTIONS_MODE picks the sanctions/PEP check: "mock" (default — always
 *  passes, exercises the plumbing only) or "opensanctions" (real, against
 *  OpenSanctions' matching API). Defaults to mock rather than throwing,
 *  unlike the identity vendors, since a placeholder here doesn't block
 *  exercising the rest of the module. */
export function buildOrchestratorFromEnv(): IdentityOrchestrator {
  const vendor = (process.env.KYC_VENDOR ?? "smile").toLowerCase();

  let idVerification;
  if (vendor === "smile") {
    const partnerId = process.env.SMILE_PARTNER_ID;
    const apiKey = process.env.SMILE_API_KEY;
    const server = (process.env.SMILE_SERVER ?? "0") as "0" | "1";
    if (!partnerId || !apiKey) {
      throw new Error(
        "Missing SMILE_PARTNER_ID / SMILE_API_KEY. Sign up for a free Smile ID sandbox account " +
          "and set both in .env — see .env.example. (Or set KYC_VENDOR=qoreid/mock instead.)",
      );
    }
    idVerification = new SmileIdentityClient({ partnerId, apiKey, server });
  } else if (vendor === "qoreid") {
    const clientId = process.env.QOREID_CLIENT_ID;
    const secret = process.env.QOREID_CLIENT_SECRET;
    if (!clientId || !secret) {
      throw new Error(
        "Missing QOREID_CLIENT_ID / QOREID_CLIENT_SECRET. Sign up for a QoreID account and set " +
          "both in .env — see .env.example. (Or set KYC_VENDOR=smile/mock instead.)",
      );
    }
    idVerification = new QoreIDClient({ clientId, secret, baseUrl: process.env.QOREID_BASE_URL });
  } else if (vendor === "mock") {
    idVerification = new MockIdVerificationClient();
  } else {
    throw new Error(`Unknown KYC_VENDOR "${vendor}" — expected "smile", "qoreid", or "mock".`);
  }

  const sanctionsMode = (process.env.SANCTIONS_MODE ?? "mock").toLowerCase();
  let sanctions;
  if (sanctionsMode === "opensanctions") {
    const apiKey = process.env.OPENSANCTIONS_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing OPENSANCTIONS_API_KEY. Sign up at opensanctions.org and set it in .env — " +
          "see .env.example. (Or set SANCTIONS_MODE=mock to skip real screening for now.)",
      );
    }
    sanctions = new OpenSanctionsClient({ apiKey, baseUrl: process.env.OPENSANCTIONS_BASE_URL });
  } else if (sanctionsMode === "mock") {
    sanctions = new MockSanctionsClient();
  } else {
    throw new Error(`Unknown SANCTIONS_MODE "${sanctionsMode}" — expected "mock" or "opensanctions".`);
  }

  return new IdentityOrchestrator(new MockNiaClient(), idVerification, sanctions);
}
