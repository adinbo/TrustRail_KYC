import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { verifySmileWebhookSignature, processVendorWebhook } from "../src/webhooks/receiver.js";

describe("Async Webhook Receiver", () => {
  const testApiKey = "secret_test_api_key_12345";

  it("verifies HMAC-SHA256 signature correctly", () => {
    const rawBody = JSON.stringify({ ResultCode: "1012", ResultText: "ID Number Validated" });
    const hmac = crypto.createHmac("sha256", testApiKey);
    hmac.update(rawBody);
    const validSignature = hmac.digest("base64");

    expect(verifySmileWebhookSignature(rawBody, validSignature, testApiKey)).toBe(true);
    expect(verifySmileWebhookSignature(rawBody, "invalid_signature", testApiKey)).toBe(false);
  });

  it("processes and normalizes Smile ID webhook payload", () => {
    const rawBody = JSON.stringify({
      ResultCode: "0810",
      ResultText: "Biometric Face Match Verified",
      Status: "clear",
      ConfidenceValue: 99.2,
      PartnerParams: {
        job_id: "job_987",
        user_id: "user_456",
      },
    });

    const result = processVendorWebhook({
      source: "smile",
      rawBody,
    });

    expect(result.jobId).toBe("job_987");
    expect(result.userId).toBe("user_456");
    expect(result.result.pass).toBe(true);
    expect(result.result.biometrics?.faceMatchScore).toBe(99.2);
    expect(result.result.biometrics?.livenessPassed).toBe(true);
  });
});
