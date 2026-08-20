/**
 * Stands in for the real NIA registry check until that onboarding is done.
 * Deterministic on the ID number so tests are repeatable: any ID number
 * starting with "0" is treated as a registry mismatch (for exercising the
 * failure path); everything else passes. This is a testing convenience,
 * not a real rule — replace entirely once the real client exists.
 */
export class MockNiaClient {
    async verifyIdentity(input) {
        const isMockFailure = input.idNumber.startsWith("0") ||
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
//# sourceMappingURL=client.js.map