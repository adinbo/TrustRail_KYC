import type { IdentityCheckResult, IdentityInput } from "../types.js";
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
export declare class MockGhanaPostClient implements AddressVerificationClient {
    verifyAddress(input: IdentityInput): Promise<IdentityCheckResult>;
}
