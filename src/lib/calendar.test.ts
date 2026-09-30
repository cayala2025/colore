import { describe, expect, it } from "vitest";
import { addDays, addMonths, daysBetween, isoWeekday, monthGrid, weekdayMon0 } from "./calendar";

describe("calendar helpers", () => {
  it("computes Monday-first weekdays", () => {
    expect(weekdayMon0("2026-09-28")).toBe(0); // Monday
    expect(weekdayMon0("2026-10-04")).toBe(6); // Sunday
    expect(isoWeekday("2026-10-04")).toBe(7);
  });

  it("adds days across months and years", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-11-29", 60)).toBe("2027-01-28");
  });

  it("counts days between dates", () => {
    expect(daysBetween("2026-09-30", "2026-11-29")).toBe(60);
    expect(daysBetween("2026-10-05", "2026-10-01")).toBe(-4);
  });

  it("adds months", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("builds a Monday-first month grid", () => {
    // October 2026 starts on a Thursday → 3 leading blanks.
    const grid = monthGrid("2026-10");
    expect(grid.slice(0, 4)).toEqual([null, null, null, "2026-10-01"]);
    expect(grid.length % 7).toBe(0);
    expect(grid.filter(Boolean)).toHaveLength(31);
  });

  it("has no leading blanks when the month starts on Monday", () => {
    expect(monthGrid("2026-06")[0]).toBe("2026-06-01");
  });
});
