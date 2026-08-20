import { validateGhanaPostGps } from "../validation.js";
/**
 * Validates and resolves GhanaPost GPS Digital Addresses for Proof of Address (PoA)
 * compliance (Tier 2/Tier 3 onboarding under Act 1154).
 */
export class MockGhanaPostClient {
    async verifyAddress(input) {
        if (!input.digitalAddress) {
            return {
                source: "address",
                pass: false,
                detail: { error: "No digital address provided for Proof of Address check." },
            };
        }
        const validation = validateGhanaPostGps(input.digitalAddress);
        if (!validation.valid) {
            return {
                source: "address",
                pass: false,
                detail: { error: validation.error },
            };
        }
        const addressData = {
            digitalAddress: validation.formattedAddress,
            region: validation.regionName,
            district: `${validation.regionName} District`,
            latitude: 5.6037, // Accra coordinates mock
            longitude: -0.187,
            validated: true,
        };
        return {
            source: "address",
            pass: true,
            detail: addressData,
        };
    }
}
//# sourceMappingURL=ghanapost.js.map