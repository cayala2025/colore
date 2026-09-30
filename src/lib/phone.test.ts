import { describe, expect, it } from "vitest";
import { e164Digits, isE164, toE164 } from "./phone";

describe("toE164", () => {
  it("normalizes Mexican numbers", () => {
    expect(toE164("52", "686 123 4567")).toBe("+526861234567");
    expect(toE164("52", "(686) 123-4567")).toBe("+526861234567");
    expect(toE164("52", "+52 686 123 4567")).toBe("+526861234567");
    expect(toE164("52", "5216861234567")).toBe("+526861234567");
  });

  it("normalizes US numbers", () => {
    expect(toE164("1", "760 555 1234")).toBe("+17605551234");
    expect(toE164("1", "1 760 555 1234")).toBe("+17605551234");
  });

  it("rejects invalid numbers", () => {
    expect(toE164("52", "")).toBeNull();
    expect(toE164("52", "12345")).toBeNull();
    expect(toE164("52", "0686123456")).toBeNull();
    expect(toE164("1", "1234567890")).toBeNull();
    expect(toE164("52", "68612345678")).toBeNull();
  });
});

describe("isE164 / e164Digits", () => {
  it("validates stored format", () => {
    expect(isE164("+526861234567")).toBe(true);
    expect(isE164("+17605551234")).toBe(true);
    expect(isE164("526861234567")).toBe(false);
    expect(isE164("+44123456789")).toBe(false);
  });
  it("strips to digits", () => {
    expect(e164Digits("+526861234567")).toBe("526861234567");
  });
});
