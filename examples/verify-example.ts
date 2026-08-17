import "dotenv/config";
import { buildOrchestratorFromEnv } from "../src/index.js";

/** Run with: npm run example
 *  Needs KYC_VENDOR set to "smile" or "qoreid" (default "smile") plus that
 *  vendor's credentials in .env — see .env.example. NIA stays mocked
 *  regardless (see PLAN.md).
 *
 *  Defaults below are Smile ID's published "happy path" sandbox test
 *  identity (see src/smile/client.ts) — their sandbox matches on
 *  firstName+lastName+email exactly, not on idNumber/dateOfBirth. Override
 *  via env vars if you're running against QoreID instead, where idNumber
 *  is what actually gets looked up. */
async function main() {
  const orchestrator = buildOrchestratorFromEnv();

  // 1x1 sample base64 PNG for demo biometric photo submission
  const samplePhoto = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const result = await orchestrator.verify({
    firstName: process.env.TEST_FIRST_NAME ?? "Amina Fatou",
    lastName: process.env.TEST_LAST_NAME ?? "Clearwater",
    email: process.env.TEST_EMAIL ?? "amina.clearwater@example.com",
    idNumber: process.env.TEST_ID_NUMBER ?? "GHA-712345678-1",
    dateOfBirth: "1990-01-01",
    expiryDate: "2030-01-01",
    digitalAddress: "GA-183-9214",
    selfieImage: samplePhoto,
    idCardFrontImage: samplePhoto,
    externalRef: `trustrail-example-${Date.now()}`,
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.verified ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
