import { describe, expect, it } from "vitest";
import { mapRpcError, statusFor } from "./bookingErrors";

describe("mapRpcError", () => {
  it("maps known RPC errors", () => {
    expect(mapRpcError("slot_full")).toBe("slotFull");
    expect(mapRpcError("phone_has_booking")).toBe("phoneHasBooking");
    expect(mapRpcError("date_blocked")).toBe("dateBlocked");
    expect(mapRpcError("slot_started")).toBe("slotStarted");
    expect(mapRpcError("out_of_window")).toBe("invalid");
  });
  it("falls back to generic", () => {
    expect(mapRpcError("connection reset")).toBe("generic");
    expect(mapRpcError(undefined)).toBe("generic");
  });
  it("uses conflict status for business-rule rejections", () => {
    expect(statusFor("slotFull")).toBe(409);
    expect(statusFor("turnstile")).toBe(403);
    expect(statusFor("invalid")).toBe(400);
  });
});
