import type { IdentityInput } from "../types.js";
import type { InHouseVerificationReport, VerificationCertificate } from "./types.js";
/**
 * Masks citizen names and ID numbers for compliance display (e.g. "Kw*** Me***" / "GHA-1234*****-1").
 */
export declare function maskCitizenPii(name?: string, idNumber?: string): {
    fullNameMasked: string;
    idNumberMasked: string;
};
/**
 * Generates an HMAC-SHA256 signed Verification Certificate.
 */
export declare function generateVerificationCertificate(input: IdentityInput, report: InHouseVerificationReport, secret?: string): VerificationCertificate;
/**
 * Validates the cryptographic HMAC signature on an issued certificate.
 */
export declare function verifyCertificateSignature(cert: VerificationCertificate, secret?: string): boolean;
