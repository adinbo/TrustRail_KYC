import type { IdentityCheckResult, IdentityInput } from "../types.js";
import { validateGhanaPostGps } from "../validation.js";

export interface AddressVerificationClient {
  verifyAddress(input: IdentityInput): Promise<IdentityCheckResult>;
}

export interface GhanaPostGpsResult {
  digitalAddress: string;
  region: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  validated: boolean;
}

/**
 * Validates and resolves GhanaPost GPS Digital Addresses for Proof of Address (PoA)
 * compliance (Tier 2/Tier 3 onboarding under Act 1154).
 */
export class MockGhanaPostClient implements AddressVerificationClient {
  async verifyAddress(input: IdentityInput): Promise<IdentityCheckResult> {
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

    const addressData: GhanaPostGpsResult = {
      digitalAddress: validation.formattedAddress!,
      region: validation.regionName!,
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
