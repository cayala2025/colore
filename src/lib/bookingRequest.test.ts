import { describe, expect, it } from "vitest";
import { parseBookingRequest } from "./bookingRequest";

const valid = {
  date: "2026-10-08",
  start: "16:00",
  party: 2,
  name: "  Ana López ",
  country: "52",
  phone: "686 123 4567",
  email: "Ana@Example.com",
  whatsappOptIn: true,
  privacy: true,
  turnstileToken: "tok",
};

describe("parseBookingRequest", () => {
  it("normalizes a valid body", () => {
    expect(parseBookingRequest(valid)).toEqual({
      date: "2026-10-08",
      start: "16:00",
      party: 2,
      name: "Ana López",
      phone: "+526861234567",
      email: "ana@example.com",
      whatsappOptIn: true,
      turnstileToken: "tok",
    });
  });

  it("rejects bad input", () => {
    expect(parseBookingRequest(null)).toBeNull();
    expect(parseBookingRequest({ ...valid, party: 9 })).toBeNull();
    expect(parseBookingRequest({ ...valid, party: 0 })).toBeNull();
    expect(parseBookingRequest({ ...valid, date: "08/10/2026" })).toBeNull();
    expect(parseBookingRequest({ ...valid, country: "44" })).toBeNull();
    expect(parseBookingRequest({ ...valid, phone: "123" })).toBeNull();
    expect(parseBookingRequest({ ...valid, privacy: false })).toBeNull();
    expect(parseBookingRequest({ ...valid, privacy: "true" })).toBeNull();
  });

  it("supports US numbers", () => {
    expect(parseBookingRequest({ ...valid, country: "1", phone: "760-555-1234" })?.phone).toBe("+17605551234");
  });
});
