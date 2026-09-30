import { describe, expect, it } from "vitest";
import { bookableMonths, isMonday, isWithinBookingWindow, lastBookableDate } from "./bookingWindow";

const today = "2026-09-30";

describe("booking window", () => {
  it("allows today and up to 60 days ahead", () => {
    expect(isWithinBookingWindow("2026-09-30", today)).toBe(true);
    expect(isWithinBookingWindow("2026-11-29", today)).toBe(true);
  });

  it("rejects past days and days beyond 60", () => {
    expect(isWithinBookingWindow("2026-09-29", today)).toBe(false);
    expect(isWithinBookingWindow("2026-11-30", today)).toBe(false);
  });

  it("detects Mondays", () => {
    expect(isMonday("2026-10-05")).toBe(true);
    expect(isMonday("2026-10-06")).toBe(false);
  });

  it("computes the last bookable date and month range", () => {
    expect(lastBookableDate(today)).toBe("2026-11-29");
    expect(bookableMonths(today)).toEqual({ min: "2026-09", max: "2026-11" });
  });
});
