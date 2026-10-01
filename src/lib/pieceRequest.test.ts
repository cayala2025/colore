import { describe, expect, it } from "vitest";
import { isAcceptablePhoto, parsePieceFields } from "./pieceRequest";

const fields: Record<string, string> = {
  name: "Ana López",
  country: "1",
  phone: "(760) 555-1234",
  email: "ANA@example.com",
  whatsappOptIn: "true",
  policy: "true",
  turnstileToken: "tok",
};
const get = (overrides: Record<string, string> = {}) => (k: string) => ({ ...fields, ...overrides })[k];

describe("parsePieceFields", () => {
  it("normalizes valid fields", () => {
    expect(parsePieceFields(get())).toEqual({
      name: "Ana López",
      phone: "+17605551234",
      email: "ana@example.com",
      whatsappOptIn: true,
      turnstileToken: "tok",
    });
  });
  it("requires the pickup policy and valid contact data", () => {
    expect(parsePieceFields(get({ policy: "false" }))).toBeNull();
    expect(parsePieceFields(get({ phone: "12" }))).toBeNull();
    expect(parsePieceFields(get({ country: "34" }))).toBeNull();
  });
});

describe("isAcceptablePhoto", () => {
  it("accepts small images only", () => {
    expect(isAcceptablePhoto(new Blob(["x"], { type: "image/jpeg" }))).toBe(true);
    expect(isAcceptablePhoto(new Blob(["x"], { type: "application/pdf" }))).toBe(false);
    expect(isAcceptablePhoto(new Blob([], { type: "image/jpeg" }))).toBe(false);
    expect(isAcceptablePhoto(new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: "image/jpeg" }))).toBe(false);
    expect(isAcceptablePhoto("nope")).toBe(false);
  });
});
