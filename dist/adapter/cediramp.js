import { isValidGhanaCard, normalizeGhanaCard, validateDateOfBirth, normalizePhoneNumber, validateGhanaPhoneNumber, validateUsPhoneNumber, } from "../validation.js";
import { maskIdentityInput } from "../utils/masking.js";
/**
 * Translates individual check failures into clear, actionable human-readable explanations.
 */
export function formatFailureDiagnostics(result) {
    const diagnostics = [];
    for (const check of result.checks) {
        if (check.pass)
            continue;
        switch (check.source) {
            case "expiry":
                diagnostics.push(`[Document Expiry]: ${check.detail?.error || "The ID document is expired."}`);
                break;
            case "nia":
                diagnostics.push(`[Government Registry (NIA)]: ${check.detail?.note || "Record not found in the National Identity Register."}`);
                break;
            case "smile": {
                const detail = check.detail;
                const reason = detail.error || `Result code: ${detail.resultCode || detail.status || "Check failed"}`;
                diagnostics.push(`[Smile ID Biometrics]: ${reason}`);
                break;
            }
            case "qoreid": {
                const detail = check.detail;
                const raw = check.raw;
                const fields = raw?.summary?.ghana_id_check?.fieldMatches;
                let msg = detail.error || detail.body?.message || `Status: ${detail.overallStatus || "mismatch"} (${detail.matchStatus || ""})`;
                if (fields) {
                    const failedFields = Object.entries(fields).filter(([_, matched]) => !matched).map(([f]) => f);
                    if (failedFields.length > 0) {
                        msg += ` — Mismatched fields: ${failedFields.join(", ")}`;
                    }
                }
                diagnostics.push(`[QoreID Verification]: ${msg}`);
                break;
            }
            case "inhouse": {
                const detail = check.detail;
                const issues = detail.discrepancies?.join(", ") || detail.note || "In-house identity check failed.";
                diagnostics.push(`[In-House KYC Engine]: ${issues} (Risk Score: ${detail.riskScore ?? "N/A"})`);
                break;
            }
            case "sanctions": {
                const detail = check.detail;
                diagnostics.push(`[Sanctions & AML]: ${detail.note || `Matched watchlist entity: ${detail.matchedName?.join(", ")}`}`);
                break;
            }
            case "address": {
                const detail = check.detail;
                diagnostics.push(`[Proof of Address]: ${detail.error || "Digital address verification failed."}`);
                break;
            }
            default:
                diagnostics.push(`[${check.source.toUpperCase()}]: Check failed.`);
        }
    }
    return diagnostics;
}
/**
 * Adapter providing seamless integration between TrustRail-KYC and CediRamp's
 * user onboarding/verification pipeline (e.g. POST /v1/users).
 */
export class CediRampKycAdapter {
    orchestrator;
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
    }
    /**
     * Evaluates input, applies pre-flight validation rules, and runs the full orchestrator
     * verification pipeline (Registry + Vendor + Sanctions).
     */
    async evaluateUser(params) {
        // 1. Format & normalize names
        const nameParts = params.fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : nameParts[0] || "";
        const normalizedId = normalizeGhanaCard(params.idNumber);
        // 2. Pre-flight input validation
        if (!isValidGhanaCard(normalizedId)) {
            return {
                passed: false,
                reason: `Invalid Ghana Card format (${normalizedId}). Expected format: GHA-XXXXXXXXX-X`,
                details: {
                    validationPassed: false,
                    maskedAudit: maskIdentityInput({
                        firstName,
                        lastName,
                        idNumber: normalizedId,
                        dateOfBirth: params.dateOfBirth,
                        phoneNumber: params.phoneNumber,
                        email: params.email,
                        externalRef: params.userId,
                    }),
                },
            };
        }
        const dobValidation = validateDateOfBirth(params.dateOfBirth, 18);
        if (!dobValidation.valid) {
            return {
                passed: false,
                reason: dobValidation.error || "Date of birth verification failed",
                details: {
                    validationPassed: false,
                    maskedAudit: maskIdentityInput({
                        firstName,
                        lastName,
                        idNumber: normalizedId,
                        dateOfBirth: params.dateOfBirth,
                        phoneNumber: params.phoneNumber,
                        email: params.email,
                        externalRef: params.userId,
                    }),
                },
            };
        }
        if (params.phoneNumber) {
            const cleanDigits = params.phoneNumber.replace(/[^\d+]/g, "");
            const isGhana = cleanDigits.startsWith("+233") || cleanDigits.startsWith("233") || (cleanDigits.startsWith("0") && cleanDigits.length === 10);
            const phoneValidation = isGhana
                ? validateGhanaPhoneNumber(params.phoneNumber)
                : validateUsPhoneNumber(params.phoneNumber);
            if (!phoneValidation.valid) {
                return {
                    passed: false,
                    reason: phoneValidation.error || "Invalid phone number format",
                    details: {
                        validationPassed: false,
                        maskedAudit: maskIdentityInput({
                            firstName,
                            lastName,
                            idNumber: normalizedId,
                            dateOfBirth: params.dateOfBirth,
                            phoneNumber: params.phoneNumber,
                            email: params.email,
                            externalRef: params.userId,
                        }),
                    },
                };
            }
        }
        const identityInput = {
            firstName,
            lastName,
            idNumber: normalizedId,
            dateOfBirth: params.dateOfBirth.trim(),
            phoneNumber: normalizePhoneNumber(params.phoneNumber),
            email: params.email?.trim(),
            externalRef: params.userId,
            expiryDate: params.expiryDate?.trim(),
            digitalAddress: params.digitalAddress?.trim(),
            selfieImage: params.selfieImage,
            idCardFrontImage: params.idCardFrontImage,
            idCardBackImage: params.idCardBackImage,
            consentGiven: params.consentGiven,
            consentTimestamp: params.consentTimestamp,
            ipAddress: params.ipAddress,
        };
        // 3. Run Orchestrator
        const result = await this.orchestrator.verify(identityInput);
        const diagnostics = formatFailureDiagnostics(result);
        const reason = diagnostics.length > 0
            ? diagnostics.join(" | ")
            : undefined;
        let assignedTier;
        if (result.verified) {
            if (params.idCardFrontImage && params.idCardBackImage && params.selfieImage && params.digitalAddress) {
                assignedTier = 3;
            }
            else if (params.selfieImage && params.digitalAddress) {
                assignedTier = 2;
            }
            else {
                assignedTier = 1;
            }
        }
        return {
            passed: result.verified,
            assignedTier,
            flaggedForReview: result.flaggedForReview,
            reason,
            details: {
                validationPassed: true,
                verificationResult: result,
                maskedAudit: maskIdentityInput(identityInput),
            },
        };
    }
}
//# sourceMappingURL=cediramp.js.map