import { describe, expect, it } from "vitest";
import {
  isValidGhanaCard,
  normalizeGhanaCard,
  validateDateOfBirth,
  normalizePhoneNumber,
  validateGhanaPhoneNumber,
} from "../src/validation.js";

describe("Input Validation & Normalization", () => {
  describe("Ghana Card format validation", () => {
    it("accepts valid Ghana Card numbers", () => {
      expect(isValidGhanaCard("GHA-123456789-0")).toBe(true);
      expect(isValidGhanaCard("gha-987654321-5")).toBe(true);
    });

    it("rejects invalid formats", () => {
      expect(isValidGhanaCard("")).toBe(false);
      expect(isValidGhanaCard("1234567890")).toBe(false);
      expect(isValidGhanaCard("GHA-12345678-0")).toBe(false); // only 8 digits
      expect(isValidGhanaCard("GHA-1234567890-0")).toBe(false); // 10 digits
      expect(isValidGhanaCard("NGA-123456789-0")).toBe(false);
    });

    it("normalizes to uppercase trimmed", () => {
      expect(normalizeGhanaCard("  gha-123456789-0 ")).toBe("GHA-123456789-0");
    });
  });

  describe("Date of birth and age validation", () => {
    it("validates adults >= 18 years old", () => {
      const res = validateDateOfBirth("1990-01-01", 18);
      expect(res.valid).toBe(true);
      expect(res.age).toBeGreaterThanOrEqual(18);
    });

    it("rejects minors under 18", () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const recentDob = `${currentYear - 10}-01-01`;
      const res = validateDateOfBirth(recentDob, 18);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("at least 18 years old");
    });

    it("rejects malformed date strings", () => {
      expect(validateDateOfBirth("not-a-date").valid).toBe(false);
      expect(validateDateOfBirth("01/01/1990").valid).toBe(false);
    });
  });

  describe("Phone number normalization", () => {
    it("cleans spaces and hyphens and normalizes to standard format", () => {
      expect(normalizePhoneNumber("+233 24 123 4567")).toBe("0241234567");
      expect(normalizePhoneNumber("+233241234567")).toBe("0241234567");
      expect(normalizePhoneNumber("+2330241234567")).toBe("0241234567");
      expect(normalizePhoneNumber("233241234567")).toBe("0241234567");
      expect(normalizePhoneNumber("241234567")).toBe("0241234567");
      expect(normalizePhoneNumber("024-123-4567")).toBe("0241234567");
      expect(normalizePhoneNumber("024 123 4567")).toBe("0241234567");
    });

    it("validates network prefix and rejects random letters/invalid lengths", () => {
      expect(validateGhanaPhoneNumber("+233 24 123 4567").valid).toBe(true);
      expect(validateGhanaPhoneNumber("+233 24 123 4567").network).toBe("MTN");

      expect(validateGhanaPhoneNumber("+233 20 123 4567").valid).toBe(true);
      expect(validateGhanaPhoneNumber("+233 20 123 4567").network).toBe("Telecel");

      expect(validateGhanaPhoneNumber("invalid text").valid).toBe(false);
      expect(validateGhanaPhoneNumber("12345").valid).toBe(false);
      expect(validateGhanaPhoneNumber("").valid).toBe(true);
    });
  });
});
