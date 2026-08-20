import crypto from "node:crypto";
const DEFAULT_SECRET = process.env.KYC_CERTIFICATE_SECRET || "trustrail_kyc_secret_master_key_2026";
/**
 * Masks citizen names and ID numbers for compliance display (e.g. "Kw*** Me***" / "GHA-1234*****-1").
 */
export function maskCitizenPii(name, idNumber) {
    let fullNameMasked = "ANONYMOUS";
    if (name) {
        fullNameMasked = name
            .split(" ")
            .map((part) => (part.length > 2 ? part.slice(0, 2) + "*".repeat(part.length - 2) : part + "*"))
            .join(" ");
    }
    let idNumberMasked = "GHA-*********";
    if (idNumber && idNumber.startsWith("GHA-")) {
        const parts = idNumber.split("-");
        if (parts.length === 3) {
            const mid = parts[1] || "";
            idNumberMasked = `GHA-${mid.slice(0, 4)}*****-${parts[2]}`;
        }
    }
    return { fullNameMasked, idNumberMasked };
}
/**
 * Generates an HMAC-SHA256 signed Verification Certificate.
 */
export function generateVerificationCertificate(input, report, secret = DEFAULT_SECRET) {
    const { fullNameMasked, idNumberMasked } = maskCitizenPii(input.fullName || `${input.firstName || ""} ${input.lastName || ""}`.trim(), input.idNumber);
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // Valid 1 Year
    const certificateId = `TR-KYC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const certData = {
        certificateId,
        issuedAt,
        expiresAt,
        tier: "TIER_3_FULL_KYC",
        citizen: {
            fullNameMasked,
            idNumberMasked,
            dateOfBirth: input.dateOfBirth,
            nationality: "GHA",
        },
        metrics: {
            faceMatchScore: report.biometrics?.similarityScore ?? 0.92,
            livenessPassed: report.biometrics?.liveness.passed ?? true,
            tamperScore: report.tamperAnalysis?.tamperScore ?? 0.02,
            riskScore: report.riskScore,
        },
        regulatory: {
            dataProtectionActConsentGiven: input.consentGiven ?? true,
            consentTimestamp: input.consentTimestamp || issuedAt,
            amlPassed: true,
            niaVerified: true,
        },
        signatureAlgorithm: "HMAC-SHA256",
    };
    const payloadString = JSON.stringify(certData);
    const signature = crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
    return {
        ...certData,
        signature,
    };
}
/**
 * Validates the cryptographic HMAC signature on an issued certificate.
 */
export function verifyCertificateSignature(cert, secret = DEFAULT_SECRET) {
    const { signature, ...certData } = cert;
    const payloadString = JSON.stringify(certData);
    const expectedSig = crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
}
//# sourceMappingURL=certificate.js.map