import { describe, it, expect } from "vitest";
import { MockNiaClient } from "../src/nia/client.js";
import type { IdentityInput } from "../src/types.js";

const baseInput: IdentityInput = {
  firstName: "Ama",
  lastName: "Mensah",
  idNumber: "GHA-123456789-0",
  dateOfBirth: "1990-01-01",
  externalRef: "user-1",
};

describe("MockNiaClient", () => {
  it("passes for an ID number not starting with 0", async () => {
    const result = await new MockNiaClient().verifyIdentity(baseInput);
    expect(result.source).toBe("nia");
    expect(result.pass).toBe(true);
  });

  it("fails for an ID number starting with 0 (the deliberate failure-path test hook)", async () => {
    const result = await new MockNiaClient().verifyIdentity({ ...baseInput, idNumber: "0123456" });
    expect(result.pass).toBe(false);
  });
});
