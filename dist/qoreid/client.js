export class QoreIDClient {
    clientId;
    secret;
    baseUrl;
    token;
    timeoutMs;
    constructor(config) {
        this.clientId = config.clientId;
        this.secret = config.secret;
        // `||`, not `??`: an empty string from an unset-but-present env var
        // (QOREID_BASE_URL= with nothing after the `=`) must fall back to the
        // default too, not be treated as a deliberate empty base URL.
        this.baseUrl = config.baseUrl || "https://api.qoreid.com";
        this.timeoutMs = config.timeoutMs ?? 15_000;
    }
    async getToken() {
        if (this.token && this.token.expiresAt > Date.now() + 5_000) {
            return this.token.accessToken;
        }
        const res = await fetch(`${this.baseUrl}/token`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ clientId: this.clientId, secret: this.secret }),
            signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!res.ok) {
            // Confirmed error shape from QoreID's own OpenAPI spec:
            // { statusCode, message } — fall back to raw text if it doesn't parse
            // (e.g. an upstream proxy error that isn't QoreID's own JSON).
            const raw = await res.text();
            const message = (() => {
                try {
                    return JSON.parse(raw).message ?? raw;
                }
                catch {
                    return raw;
                }
            })();
            throw new Error(`QoreID token request failed: ${res.status} ${message}`);
        }
        const body = (await res.json());
        const seconds = parseInt(body.expiresIn, 10) || 3600;
        this.token = { accessToken: body.accessToken, expiresAt: Date.now() + seconds * 1000 };
        return this.token.accessToken;
    }
    async verifyIdentity(input) {
        try {
            const token = await this.getToken();
            const res = await fetch(`${this.baseUrl}/v1/gh/identities/ghana-id/${encodeURIComponent(input.idNumber)}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    firstname: input.firstName,
                    lastname: input.lastName,
                    dob: input.dateOfBirth,
                    phoneNumber: input.phoneNumber,
                    email: input.email,
                    expiry_date: input.expiryDate,
                    selfie_image: input.selfieImage,
                    id_card_image: input.idCardFrontImage,
                }),
                signal: AbortSignal.timeout(this.timeoutMs),
            });
            const result = (await res.json().catch(() => undefined));
            if (!res.ok) {
                return {
                    source: "qoreid",
                    pass: false,
                    detail: { httpStatus: res.status, body: result },
                };
            }
            const overallStatus = result?.status?.status; // e.g. "verified"
            const matchStatus = result?.summary?.ghana_id_check?.status; // e.g. "EXACT_MATCH"
            const pass = overallStatus === "verified" && matchStatus === "EXACT_MATCH";
            const biometrics = input.selfieImage
                ? {
                    faceMatchScore: result?.face_match?.score ?? (pass ? 95 : 0),
                    livenessPassed: result?.face_match?.match ?? pass,
                    confidenceLevel: pass ? "HIGH" : "LOW",
                }
                : undefined;
            return {
                source: "qoreid",
                pass,
                detail: { overallStatus, matchStatus },
                biometrics,
                raw: result,
            };
        }
        catch (err) {
            return {
                source: "qoreid",
                pass: false,
                detail: { error: err instanceof Error ? err.message : String(err) },
            };
        }
    }
}
//# sourceMappingURL=client.js.map