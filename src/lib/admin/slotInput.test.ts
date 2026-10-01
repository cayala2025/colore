import { describe, expect, it } from "vitest";
import { validateSlotInput } from "./slotInput";

describe("validateSlotInput", () => {
  it("accepts a valid slot", () => {
    expect(validateSlotInput({ start: "11:00", end: "13:00", capacity: 30, active: true })).toBeNull();
  });
  it("rejects bad times", () => {
    expect(validateSlotInput({ start: "13:00", end: "11:00", capacity: 30, active: true })).toBe("time");
    expect(validateSlotInput({ start: "25:00", end: "26:00", capacity: 30, active: true })).toBe("time");
    expect(validateSlotInput({ start: "9:00", end: "11:00", capacity: 30, active: true })).toBe("time");
  });
  it("rejects bad capacity", () => {
    expect(validateSlotInput({ start: "11:00", end: "13:00", capacity: -1, active: true })).toBe("capacity");
    expect(validateSlotInput({ start: "11:00", end: "13:00", capacity: 2.5, active: true })).toBe("capacity");
    expect(validateSlotInput({ start: "11:00", end: "13:00", capacity: 500, active: true })).toBe("capacity");
  });
});
