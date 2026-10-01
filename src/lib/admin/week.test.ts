import { describe, expect, it } from "vitest";
import type { AdminBooking } from "./daySlots";
import { buildWeek, mondayOf } from "./week";

const schedule = [2, 3, 4, 5, 6, 7].map((weekday) => ({
  weekday,
  start_time: "11:00:00",
  end_time: "13:00:00",
  capacity: 30,
  active: true,
}));

describe("week view", () => {
  it("finds the Monday of any date", () => {
    expect(mondayOf("2026-10-08")).toBe("2026-10-05");
    expect(mondayOf("2026-10-05")).toBe("2026-10-05");
    expect(mondayOf("2026-10-11")).toBe("2026-10-05");
  });

  it("builds 7 days Monday→Sunday with slots, blocks and bookings", () => {
    const booking = { id: "1", date: "2026-10-08", start_time: "11:00:00", end_time: "13:00:00", party_size: 3, status: "confirmed" } as AdminBooking;
    const week = buildWeek("2026-10-05", schedule, ["2026-10-10"], [booking]);
    expect(week.map((d) => d.date)).toEqual([
      "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11",
    ]);
    expect(week[0].slots).toEqual([]); // Monday closed
    expect(week[3].slots[0]).toMatchObject({ used: 3, free: 27 });
    expect(week[5].blocked).toBe(true);
  });
});
