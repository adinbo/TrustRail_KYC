import type { IdentityCheckResult } from "../types.js";
export interface WebhookVerificationPayload {
    source: "smile" | "qoreid";
    signature?: string;
    timestamp?: string;
    rawBody: string;
}
export interface WebhookProcessResult {
    verifiedSignature: boolean;
    jobId?: string;
    userId?: string;
    result: IdentityCheckResult;
}
/**
 * Verifies Smile ID HMAC-SHA256 signature on incoming webhooks.
 */
export declare function verifySmileWebhookSignature(rawBody: string, signature: string, apiKey: string): boolean;
/**
 * Parses and normalizes incoming asynchronous vendor webhook callbacks.
 */
export declare function processVendorWebhook(payload: WebhookVerificationPayload, secretKey?: string): WebhookProcessResult;
