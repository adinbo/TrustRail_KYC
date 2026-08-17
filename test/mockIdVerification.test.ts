import { describe, it, expect } from "vitest";
import { MockIdVerificationClient } from "../src/mock/idVerification.js";
import type { IdentityInput } from "../src/types.js";

const baseInput: IdentityInput = {
  firstName: "Ama",
  lastName: "Mensah",
  idNumber: "GHA-123456789-0",
  dateOfBirth: "1990-01-01",
  externalRef: "user-1",
};

describe("MockIdVerificationClient", () => {
  it("passes for an ID number not starting with 0, and honestly labels its source as 'mock'", async () => {
    const result = await new MockIdVerificationClient().verifyIdentity(baseInput);
    expect(result.source).toBe("mock");
    expect(result.pass).toBe(true);
  });

  it("fails for an ID number starting with 0 or GHA-0 (e.g. GHA-000000000-0)", async () => {
    const result1 = await new MockIdVerificationClient().verifyIdentity({ ...baseInput, idNumber: "0123456" });
    expect(result1.pass).toBe(false);

    const result2 = await new MockIdVerificationClient().verifyIdentity({ ...baseInput, idNumber: "GHA-000000000-0" });
    expect(result2.pass).toBe(false);
  });
});
