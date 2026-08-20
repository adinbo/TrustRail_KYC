import "dotenv/config";
import { buildOrchestratorFromEnv } from "../index.js";
import { maskGhanaCard, maskEmail } from "../utils/masking.js";
async function runDiagnostics() {
    console.log("=========================================");
    console.log(" TrustRail-KYC Vendor Diagnostics Runner");
    console.log("=========================================");
    const kycVendor = process.env.KYC_VENDOR || "smile (default)";
    const sanctionsMode = process.env.SANCTIONS_MODE || "mock (default)";
    const niaMode = process.env.NIA_MODE || "mock (default)";
    console.log(`\n[Configuration]`);
    console.log(`- KYC_VENDOR:        ${kycVendor}`);
    console.log(`- SANCTIONS_MODE:    ${sanctionsMode}`);
    console.log(`- NIA_MODE:          ${niaMode}`);
    console.log(`- QOREID_CLIENT_ID:  ${process.env.QOREID_CLIENT_ID ? "[SET]" : "[NOT SET]"}`);
    console.log(`- SMILE_PARTNER_ID:  ${process.env.SMILE_PARTNER_ID ? "[SET]" : "[NOT SET]"}`);
    console.log(`- OPENSANCTIONS_KEY: ${process.env.OPENSANCTIONS_API_KEY ? "[SET]" : "[NOT SET]"}`);
    console.log(`\n[Building Orchestrator]`);
    let orchestrator;
    try {
        orchestrator = buildOrchestratorFromEnv();
        console.log("✓ Orchestrator built successfully from environment");
    }
    catch (err) {
        console.error("✗ Failed to build orchestrator:", err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
    console.log(`\n[Executing Test Verification Probe]`);
    const testInput = {
        firstName: "Amina Fatou",
        lastName: "Clearwater",
        idNumber: "GHA-712345678-1",
        dateOfBirth: "1995-05-15",
        email: "amina.clearwater@example.com",
        externalRef: `diag-${Date.now()}`,
    };
    console.log(`- Probing with ID: ${maskGhanaCard(testInput.idNumber)}, Email: ${maskEmail(testInput.email)}`);
    const startTime = Date.now();
    try {
        const res = await orchestrator.verify(testInput);
        const duration = Date.now() - startTime;
        console.log(`\n[Probe Results (${duration}ms)]`);
        console.log(`- Overall Verified: ${res.verified ? "YES (PASSED)" : "NO (DID NOT PASS)"}`);
        console.log(`- Checks Performed:`);
        for (const check of res.checks) {
            console.log(`  * [${check.source.toUpperCase()}] pass=${check.pass} detail=${JSON.stringify(check.detail)}`);
        }
    }
    catch (err) {
        console.error("✗ Probe failed with error:", err instanceof Error ? err.message : String(err));
    }
    console.log("\n=========================================\n");
}
runDiagnostics().catch(console.error);
//# sourceMappingURL=diagnostics.js.map