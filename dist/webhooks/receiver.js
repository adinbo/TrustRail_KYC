import crypto from "node:crypto";
/**
 * Verifies Smile ID HMAC-SHA256 signature on incoming webhooks.
 */
export function verifySmileWebhookSignature(rawBody, signature, apiKey) {
    if (!signature || !apiKey)
        return false;
    try {
        const hmac = crypto.createHmac("sha256", apiKey);
        hmac.update(rawBody);
        const expected = hmac.digest("base64");
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    }
    catch {
        return false;
    }
}
/**
 * Parses and normalizes incoming asynchronous vendor webhook callbacks.
 */
export function processVendorWebhook(payload, secretKey) {
    let verifiedSignature = true;
    if (secretKey && payload.signature) {
        verifiedSignature = verifySmileWebhookSignature(payload.rawBody, payload.signature, secretKey);
    }
    const parsed = (() => {
        try {
            return JSON.parse(payload.rawBody);
        }
        catch {
            return {};
        }
    })();
    if (payload.source === "smile") {
        const resultCode = parsed.ResultCode;
        const pass = resultCode === "1012" || resultCode === "0810" || resultCode === "1081" || parsed.Status === "clear";
        const confidenceValue = parsed.ConfidenceValue;
        return {
            verifiedSignature,
            jobId: parsed.PartnerParams?.job_id,
            userId: parsed.PartnerParams?.user_id,
            result: {
                source: "smile",
                pass,
                detail: {
                    resultCode,
                    resultText: parsed.ResultText,
                    status: parsed.Status,
                },
                biometrics: {
                    faceMatchScore: typeof confidenceValue === "number" ? confidenceValue : (pass ? 98 : 0),
                    livenessPassed: pass,
                },
                raw: parsed,
            },
        };
    }
    // QoreID webhook shape
    const overallStatus = parsed.status?.status;
    const pass = overallStatus === "verified";
    return {
        verifiedSignature,
        jobId: parsed.applicant_id || parsed.id,
        userId: parsed.customer_reference,
        result: {
            source: "qoreid",
            pass,
            detail: { overallStatus },
            raw: parsed,
        },
    };
}
//# sourceMappingURL=receiver.js.map