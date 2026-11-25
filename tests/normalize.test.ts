import { describe, expect, test } from "@jest/globals";
import {
  normalizeIdentifier,
  normalizePhoneNumber,
} from "../src/core/normalize";

describe("normalizePhoneNumber", () => {
  test("normalizes the phone formats from the brief to the same value", () => {
    expect(normalizePhoneNumber("081-234-5678")).toBe("0812345678");
    expect(normalizePhoneNumber("081 234 5678")).toBe("0812345678");
    expect(normalizePhoneNumber("0812345678")).toBe("0812345678");
  });

  test("returns null for a missing phone number", () => {
    expect(normalizePhoneNumber(null)).toBeNull();
    expect(normalizePhoneNumber(undefined)).toBeNull();
  });

  test("returns null when the phone number has no digits", () => {
    expect(normalizePhoneNumber("")).toBeNull();
    expect(normalizePhoneNumber(" - ( ) ")).toBeNull();
  });

  test("removes every non-digit character", () => {
    expect(normalizePhoneNumber("(+66) 81.234/5678 ext. 9")).toBe("668123456789");
  });
});

describe("normalizeIdentifier", () => {
  test("trims whitespace from both ends", () => {
    expect(normalizeIdentifier("  device-123  ")).toBe("device-123");
  });

  test("returns null for a missing or blank identifier", () => {
    expect(normalizeIdentifier(null)).toBeNull();
    expect(normalizeIdentifier(undefined)).toBeNull();
    expect(normalizeIdentifier("   ")).toBeNull();
  });

  test("preserves the case of an identifier", () => {
    expect(normalizeIdentifier("Device-A")).toBe("Device-A");
  });
});
