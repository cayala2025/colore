import { describe, expect, it } from "vitest";
import { computeAvailability, fits, type BookingRow, type ScheduleSlotRow } from "./availability";

// Schedule from CLAUDE.md.
const times: [string, string][] = [
  ["11:00:00", "13:00:00"],
  ["16:00:00", "18:00:00"],
  ["18:00:00", "20:00:00"],
  ["20:00:00", "22:00:00"],
];
const schedule: ScheduleSlotRow[] = [2, 3, 4, 5, 6, 7].flatMap((weekday) =>
  times
    .filter(([start]) => !(weekday <= 3 && start === "20:00:00"))
    .map(([start_time, end_time]) => ({ weekday, start_time, end_time, capacity: 30, active: true })),
);

// Wednesday 2026-09-30, 09:00 in Mexicali (16:00 UTC).
const now = new Date("2026-09-30T16:00:00Z");

function day(date: string, opts: { party?: number; bookings?: BookingRow[]; blocked?: string[]; at?: Date } = {}) {
  const [result] = computeAvailability({
    schedule,
    blockedDates: opts.blocked ?? [],
    bookings: opts.bookings ?? [],
    party: opts.party ?? 2,
    from: date,
    to: date,
    now: opts.at ?? now,
  });
  return result;
}

const booking = (date: string, start: string, party_size: number, status: BookingRow["status"] = "confirmed") => ({
  date,
  start_time: start,
  party_size,
  status,
});

describe("computeAvailability", () => {
  it("Monday is closed", () => {
    expect(day("2026-10-05")).toEqual({ date: "2026-10-05", bookable: false, slots: [] });
  });

  it("Tue–Wed have 3 slots, Thu–Sun have 4", () => {
    expect(day("2026-10-06").slots.map((s) => s.start)).toEqual(["11:00", "16:00", "18:00"]);
    expect(day("2026-10-08").slots.map((s) => s.start)).toEqual(["11:00", "16:00", "18:00", "20:00"]);
  });

  it("blocked day has no slots", () => {
    expect(day("2026-10-08", { blocked: ["2026-10-08"] })).toEqual({ date: "2026-10-08", bookable: false, slots: [] });
  });

  it("full slot shows 0 seats and the day is not bookable when every slot is full", () => {
    const full = ["11:00", "16:00", "18:00"].map((t) => booking("2026-10-06", t, 30));
    const d = day("2026-10-06", { bookings: full });
    expect(d.slots.every((s) => s.seatsLeft === 0)).toBe(true);
    expect(d.bookable).toBe(false);
  });

  it("8 people do not fit when 7 seats are left, 7 people do", () => {
    const b = [booking("2026-10-08", "16:00:00", 8), booking("2026-10-08", "16:00:00", 8), booking("2026-10-08", "16:00:00", 7)];
    const slot = (party: number) => day("2026-10-08", { bookings: b, party }).slots.find((s) => s.start === "16:00")!;
    expect(slot(8).seatsLeft).toBe(7);
    expect(fits(slot(8), 8)).toBe(false);
    expect(fits(slot(7), 7)).toBe(true);
  });

  it("cancelled and no-show bookings free their seats; attended keeps them", () => {
    const b = [
      booking("2026-10-08", "11:00", 8, "cancelled"),
      booking("2026-10-08", "11:00", 8, "no_show"),
      booking("2026-10-08", "11:00", 5, "attended"),
    ];
    expect(day("2026-10-08", { bookings: b }).slots[0].seatsLeft).toBe(25);
  });

  it("slots that already started are not offered", () => {
    // Wednesday 2026-09-30 at 16:30 Mexicali (23:30 UTC): 11:00 and 16:00 have started.
    const d = day("2026-09-30", { at: new Date("2026-09-30T23:30:00Z") });
    expect(d.slots.map((s) => s.start)).toEqual(["18:00"]);
    expect(d.bookable).toBe(true);
  });

  it("slot starting exactly now is not offered", () => {
    const d = day("2026-09-30", { at: new Date("2026-10-01T01:00:00Z") }); // 18:00 Mexicali
    expect(d.slots).toEqual([]);
  });

  it("past days and days beyond 60 are not bookable", () => {
    expect(day("2026-09-29").slots).toEqual([]);
    expect(day("2026-11-29").bookable).toBe(true); // Sunday, day 60
    expect(day("2026-12-01").slots).toEqual([]);
  });

  it("returns one entry per day in the range", () => {
    const days = computeAvailability({ schedule, blockedDates: [], bookings: [], party: 1, from: "2026-10-01", to: "2026-10-31", now });
    expect(days).toHaveLength(31);
  });
});
