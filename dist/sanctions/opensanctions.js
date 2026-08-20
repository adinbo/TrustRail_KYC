export class OpenSanctionsClient {
    apiKey;
    baseUrl;
    dataset;
    country;
    timeoutMs;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || "https://api.opensanctions.org";
        this.dataset = config.dataset || "default";
        this.country = config.country ?? "GH";
        this.timeoutMs = config.timeoutMs ?? 15_000;
    }
    async screen(input) {
        try {
            const res = await fetch(`${this.baseUrl}/match/${this.dataset}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: this.apiKey,
                },
                body: JSON.stringify({
                    queries: {
                        q1: {
                            schema: "Person",
                            properties: {
                                name: [`${input.firstName} ${input.lastName}`],
                                birthDate: [input.dateOfBirth],
                                country: [this.country],
                            },
                        },
                    },
                }),
                signal: AbortSignal.timeout(this.timeoutMs),
            });
            if (!res.ok) {
                // Fail closed: an error screening a person is not the same as
                // clearing them — treat it as a failed check, not a skipped one.
                return {
                    source: "sanctions",
                    pass: false,
                    riskCategory: "SANCTION",
                    detail: { httpStatus: res.status, body: await res.text() },
                };
            }
            const body = (await res.json());
            const results = body.responses?.q1?.results ?? [];
            const hit = results.find((r) => r.match);
            if (!hit) {
                return {
                    source: "sanctions",
                    pass: true,
                    riskCategory: "CLEAR",
                    detail: { note: "no watchlist match", candidatesChecked: results.length },
                    raw: body,
                };
            }
            const topics = hit.properties?.topics || [];
            const isHardSanction = topics.some((t) => t.toLowerCase().includes("sanction")) || topics.length === 0;
            const isPep = topics.some((t) => t.toLowerCase().includes("pep") || t.toLowerCase().includes("politic"));
            const isAdverseMedia = topics.some((t) => t.toLowerCase().includes("crime") || t.toLowerCase().includes("debarment"));
            if (isHardSanction && !isPep) {
                // Hard Sanction match (OFAC, EU, UN, etc.) -> MUST NOT PASS
                return {
                    source: "sanctions",
                    pass: false,
                    riskCategory: "SANCTION",
                    detail: {
                        matchedName: hit.properties?.name,
                        score: hit.score,
                        topics,
                        note: "Mandatory Sanctions list match detected",
                    },
                    raw: body,
                };
            }
            // PEP or Adverse Media -> Passes automated gate but flags for Enhanced Due Diligence (EDD)
            const riskCategory = isPep ? "PEP" : isAdverseMedia ? "ADVERSE_MEDIA" : "SANCTION";
            return {
                source: "sanctions",
                pass: true,
                flaggedForReview: true,
                riskCategory,
                detail: {
                    matchedName: hit.properties?.name,
                    score: hit.score,
                    topics,
                    note: `${riskCategory} flagged for Enhanced Due Diligence compliance review`,
                },
                raw: body,
            };
        }
        catch (err) {
            return {
                source: "sanctions",
                pass: false,
                detail: { error: err instanceof Error ? err.message : String(err) },
            };
        }
    }
}
//# sourceMappingURL=opensanctions.js.map