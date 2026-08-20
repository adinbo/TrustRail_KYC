/** Placeholder — always passes. Replace with a real vendor integration in
 *  the next pass; do not rely on this for anything beyond exercising the
 *  orchestrator's plumbing. */
export class MockSanctionsClient {
    async screen(_input) {
        return { source: "sanctions", pass: true, detail: { note: "mock: not yet wired to a real vendor" } };
    }
}
//# sourceMappingURL=client.js.map