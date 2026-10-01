import { describe, expect, it } from "vitest";
import { canTransition } from "./bookingTransitions";

describe("canTransition", () => {
  it("confirmed bookings can be marked attended, no-show or cancelled", () => {
    expect(canTransition("confirmed", "attended")).toBe(true);
    expect(canTransition("confirmed", "no_show")).toBe(true);
    expect(canTransition("confirmed", "cancelled")).toBe(true);
  });
  it("attended/no-show can be undone", () => {
    expect(canTransition("attended", "confirmed")).toBe(true);
    expect(canTransition("no_show", "confirmed")).toBe(true);
  });
  it("cancelled bookings cannot be revived (would bypass the capacity check)", () => {
    expect(canTransition("cancelled", "confirmed")).toBe(false);
    expect(canTransition("cancelled", "attended")).toBe(false);
  });
});
