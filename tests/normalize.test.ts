import { describe, expect, test } from "@jest/globals";
import { normalizePhoneNumber } from "../src/core/normalize";

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
