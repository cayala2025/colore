import { describe, expect, it } from "vitest";
import { hasErrors, validateContact } from "./validation";

const valid = {
  name: "Ana López",
  country: "52" as const,
  phone: "686 123 4567",
  email: "ana@example.com",
  privacy: true,
};

describe("validateContact", () => {
  it("accepts valid input", () => {
    expect(hasErrors(validateContact(valid))).toBe(false);
  });

  it("flags every missing field", () => {
    expect(validateContact({ name: " ", country: "52", phone: "", email: "", privacy: false })).toEqual({
      name: "nameRequired",
      phone: "phoneRequired",
      email: "emailRequired",
      privacy: "privacyRequired",
    });
  });

  it("flags short names, bad phones and bad emails", () => {
    expect(validateContact({ ...valid, name: "A" }).name).toBe("nameTooShort");
    expect(validateContact({ ...valid, phone: "123" }).phone).toBe("phoneInvalid");
    expect(validateContact({ ...valid, email: "ana@" }).email).toBe("emailInvalid");
    expect(validateContact({ ...valid, email: "ana@correo" }).email).toBe("emailInvalid");
  });
});
