import crypto from "node:crypto";
export class SmileIdentityClient {
    partnerId;
    apiKey;
    baseUrl;
    country;
    idType;
    constructor(config) {
        this.partnerId = config.partnerId;
        this.apiKey = config.apiKey;
        this.country = config.country ?? "GH";
        this.idType = config.idType ?? "GHANA_CARD";
        if (config.baseUrl) {
            this.baseUrl = config.baseUrl;
        }
        else {
            this.baseUrl = config.server === "1"
                ? "https://api.smileidentity.com/v1"
                : "https://testapi.smileidentity.com/v1";
        }
    }
    generateSignature(timestamp) {
        const hmac = crypto.createHmac("sha256", this.apiKey);
        hmac.update(timestamp, "utf8");
        hmac.update(this.partnerId, "utf8");
        hmac.update("sid_request", "utf8");
        return hmac.digest("base64");
    }
    async verifyIdentity(input) {
        let job_type = 5;
        const images = [];
        if (input.selfieImage) {
            job_type = 1;
            images.push({ image_type_id: 2, image: input.selfieImage }); // 2 = Selfie
        }
        if (input.idCardFrontImage) {
            if (job_type !== 1)
                job_type = 6;
            images.push({ image_type_id: 1, image: input.idCardFrontImage }); // 1 = ID card front
        }
        if (input.idCardBackImage) {
            images.push({ image_type_id: 3, image: input.idCardBackImage }); // 3 = ID card back
        }
        const timestamp = new Date().toISOString();
        const signature = this.generateSignature(timestamp);
        const partner_params = {
            job_id: `trustrail-${Date.now()}`,
            user_id: input.externalRef ?? `user-${Date.now()}`,
            job_type,
        };
        const id_info = {
            first_name: input.firstName,
            last_name: input.lastName,
            country: this.country,
            id_type: input.idType ?? this.idType,
            id_number: input.idNumber,
            dob: input.dateOfBirth,
            phone_number: input.phoneNumber,
            email: input.email,
            expiry_date: input.expiryDate,
        };
        const endpoint = images.length > 0 ? `${this.baseUrl}/upload` : `${this.baseUrl}/id_verification`;
        const payload = {
            source_sdk: "rest_api",
            source_sdk_version: "1.0.0",
            partner_id: this.partnerId,
            timestamp,
            signature,
            partner_params,
            id_info,
            images: images.length > 0 ? images : undefined,
        };
        try {
            const resp = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await resp.json();
            const resultCode = result.ResultCode;
            const status = result.Status
                ?? result.status;
            // ResultCode "1012" = ID Validated; "0810" = Biometric Face Match Verified; "1081" = Document Verified
            const pass = resultCode === "1012" || resultCode === "0810" || resultCode === "1081" || status === "clear";
            const confidenceValue = result.ConfidenceValue
                ?? result.confidence;
            const biometrics = job_type === 1
                ? {
                    faceMatchScore: typeof confidenceValue === "number" ? confidenceValue : (pass ? 98 : 0),
                    livenessPassed: pass,
                    confidenceLevel: pass ? "HIGH" : "LOW",
                }
                : undefined;
            return {
                source: "smile",
                pass,
                detail: { resultCode, status, jobType: job_type },
                biometrics,
                raw: result,
            };
        }
        catch (err) {
            return {
                source: "smile",
                pass: false,
                detail: { error: err instanceof Error ? err.message : String(err), jobType: job_type },
            };
        }
    }
}
//# sourceMappingURL=client.js.map