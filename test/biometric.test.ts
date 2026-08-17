import { describe, expect, it } from "vitest";
import { SmileIdentityClient } from "../src/smile/client.js";

describe("Biometric KYC & Document Verification Dispatch", () => {
  it("constructs and configures SmileIdentityClient with dynamic biometric dispatch", () => {
    const client = new SmileIdentityClient({
      partnerId: "test_partner",
      apiKey: "test_api_key",
      server: "0",
    });

    expect(client).toBeDefined();
    expect(typeof client.verifyIdentity).toBe("function");
  });
});
