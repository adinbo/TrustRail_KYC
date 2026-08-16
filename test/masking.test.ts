import { describe, expect, it } from "vitest";
import { maskGhanaCard, maskPhoneNumber, maskEmail, maskIdentityInput } from "../src/utils/masking.js";

describe("PII Masking Utilities", () => {
  it("masks Ghana Card number properly", () => {
    expect(maskGhanaCard("GHA-123456789-0")).toBe("GHA-***-0");
    expect(maskGhanaCard("")).toBe("");
    expect(maskGhanaCard("12345")).toBe("***");
  });

  it("masks phone numbers", () => {
    expect(maskPhoneNumber("+233241234567")).toBe("+23****567");
    expect(maskPhoneNumber(undefined)).toBeUndefined();
  });

  it("masks email addresses", () => {
    expect(maskEmail("amina.clearwater@example.com")).toBe("a***r@example.com");
    expect(maskEmail("ab@example.com")).toBe("a*@example.com");
  });

  it("masks full identity input object", () => {
    const masked = maskIdentityInput({
      firstName: "Amina",
      lastName: "Clearwater",
      idNumber: "GHA-123456789-0",
      dateOfBirth: "1990-01-01",
      phoneNumber: "+233241234567",
      email: "amina.clearwater@example.com",
      externalRef: "user-123",
    });

    expect(masked.firstName).toBe("Amina");
    expect(masked.lastName).toBe("Clearwater");
    expect(masked.idNumber).toBe("GHA-***-0");
    expect(masked.dateOfBirth).toBe("1990-**-**");
    expect(masked.email).toBe("a***r@example.com");
    expect(masked.externalRef).toBe("user-123");
  });
});
