import { describe, expect, it } from "vitest";
import { isManageToken, manageView } from "./manageRules";

const now = new Date("2026-10-01T17:00:00Z");
const future = "2026-10-02T23:00:00Z";
const past = "2026-10-01T16:00:00Z";

describe("manageView", () => {
  it("upcoming confirmed booking can be confirmed and cancelled", () => {
    expect(manageView({ status: "confirmed", starts_at: future, customer_confirmed_at: null }, now)).toEqual({
      canConfirm: true,
      canCancel: true,
      isPast: false,
    });
  });
  it("already confirmed by the customer can still cancel", () => {
    expect(manageView({ status: "confirmed", starts_at: future, customer_confirmed_at: past }, now)).toMatchObject({
      canConfirm: false,
      canCancel: true,
    });
  });
  it("cancelled or started bookings cannot change", () => {
    expect(manageView({ status: "cancelled", starts_at: future, customer_confirmed_at: null }, now)).toMatchObject({ canConfirm: false, canCancel: false });
    expect(manageView({ status: "confirmed", starts_at: past, customer_confirmed_at: null }, now)).toEqual({ canConfirm: false, canCancel: false, isPast: true });
  });
});

describe("isManageToken", () => {
  it("accepts 64 hex chars only", () => {
    expect(isManageToken("a".repeat(64))).toBe(true);
    expect(isManageToken("a".repeat(63))).toBe(false);
    expect(isManageToken("../" + "a".repeat(61))).toBe(false);
  });
});
