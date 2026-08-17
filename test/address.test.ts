import { describe, expect, it } from "vitest";
import { validateGhanaPostGps, GHANAPOST_GPS_REGEX } from "../src/validation.js";
import { MockGhanaPostClient } from "../src/address/ghanapost.js";

describe("Proof of Address (GhanaPost GPS)", () => {
  describe("validateGhanaPostGps", () => {
    it("validates valid GhanaPost GPS formats across regions", () => {
      const accra = validateGhanaPostGps("GA-183-9214");
      expect(accra.valid).toBe(true);
      expect(accra.formattedAddress).toBe("GA-183-9214");
      expect(accra.regionName).toContain("Greater Accra");

      const kumasi = validateGhanaPostGps("AK-039-5028");
      expect(kumasi.valid).toBe(true);
      expect(kumasi.regionName).toContain("Ashanti");

      const western = validateGhanaPostGps("ws-059-1024");
      expect(western.valid).toBe(true);
      expect(western.formattedAddress).toBe("WS-059-1024");
    });

    it("rejects invalid formats", () => {
      expect(validateGhanaPostGps("").valid).toBe(false);
      expect(validateGhanaPostGps("INVALID-ADDRESS").valid).toBe(false);
      expect(validateGhanaPostGps("GHA-123456789-0").valid).toBe(false); // Ghana card, not GPS address
    });
  });

  describe("MockGhanaPostClient", () => {
    const client = new MockGhanaPostClient();

    it("passes for valid digital address and returns coordinates/region", async () => {
      const res = await client.verifyAddress({
        firstName: "Amina",
        lastName: "Clearwater",
        idNumber: "GHA-712345678-1",
        dateOfBirth: "1992-04-12",
        digitalAddress: "GA-183-9214",
        externalRef: "test-user",
      });

      expect(res.pass).toBe(true);
      expect(res.source).toBe("address");
      expect(res.detail).toMatchObject({
        digitalAddress: "GA-183-9214",
        region: expect.stringContaining("Greater Accra"),
        validated: true,
      });
    });

    it("fails when digital address is omitted", async () => {
      const res = await client.verifyAddress({
        firstName: "Amina",
        lastName: "Clearwater",
        idNumber: "GHA-712345678-1",
        dateOfBirth: "1992-04-12",
        externalRef: "test-user",
      });

      expect(res.pass).toBe(false);
      expect(res.detail).toMatchObject({ error: expect.stringContaining("No digital address") });
    });
  });
});
