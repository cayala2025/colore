import { describe, expect, it } from "vitest";
import type { AdminBooking } from "./daySlots";
import { buildMonth, fullness, summarizeMonth } from "./month";

// Schedule from CLAUDE.md: Tue–Wed 3 slots, Thu–Sun 4 slots, 30 seats each; Monday closed.
const times: [string, string][] = [
  ["11:00:00", "13:00:00"],
  ["16:00:00", "18:00:00"],
  ["18:00:00", "20:00:00"],
  ["20:00:00", "22:00:00"],
];
const schedule = [2, 3, 4, 5, 6, 7].flatMap((weekday) =>
  times
    .filter(([start]) => !(weekday <= 3 && start === "20:00:00"))
    .map(([start_time, end_time]) => ({ weekday, start_time, end_time, capacity: 30, active: true })),
);

const b = (date: string, start: string, party: number, status: AdminBooking["status"] = "confirmed") =>
  ({ id: `${date}-${start}-${party}-${status}`, date, start_time: start, end_time: "13:00:00", party_size: party, status }) as AdminBooking;

describe("fullness", () => {
  it("buckets by share of capacity", () => {
    expect(fullness(0, 120)).toBe("empty");
    expect(fullness(30, 120)).toBe("low");
    expect(fullness(60, 120)).toBe("medium");
    expect(fullness(110, 120)).toBe("high");
    expect(fullness(120, 120)).toBe("full");
    expect(fullness(5, 0)).toBe("full"); // bookings on a slot that was turned off
  });
});

describe("buildMonth", () => {
  const bookings = [
    b("2026-10-08", "11:00:00", 8),
    b("2026-10-08", "16:00:00", 4, "attended"),
    b("2026-10-08", "16:00:00", 6, "cancelled"),
    b("2026-10-08", "18:00:00", 2, "no_show"),
  ];
  const days = buildMonth("2026-10", schedule, ["2026-10-10"], bookings);

  it("has every day of the month", () => {
    expect(days).toHaveLength(31);
    expect(days[0].date).toBe("2026-10-01");
    expect(days.at(-1)?.date).toBe("2026-10-31");
  });

  it("Mondays are closed with no capacity", () => {
    expect(days[4]).toMatchObject({ date: "2026-10-05", closed: true, capacity: 0, used: 0, level: "empty" });
  });

  it("Tue–Wed have 90 seats, Thu–Sun 120", () => {
    expect(days[5]).toMatchObject({ date: "2026-10-06", capacity: 90, closed: false });
    expect(days[7]).toMatchObject({ date: "2026-10-08", capacity: 120 });
  });

  it("counts confirmed + attended; cancelled and no-show free their seats", () => {
    expect(days[7].used).toBe(12);
    expect(days[7].slots.map((s) => [s.start, s.used])).toEqual([
      ["11:00", 8],
      ["16:00", 4],
      ["18:00", 0],
      ["20:00", 0],
    ]);
    expect(days[7].level).toBe("low");
  });

  it("marks blocked days", () => {
    expect(days[9]).toMatchObject({ date: "2026-10-10", blocked: true });
  });

  it("a full day is 'full'", () => {
    const full = times.map(([start]) => b("2026-10-11", start, 30));
    expect(buildMonth("2026-10", schedule, [], full)[10]).toMatchObject({ used: 120, level: "full" });
  });
});

describe("summarizeMonth", () => {
  it("totals bookings, people, no-shows and the busiest day", () => {
    const bookings = [
      b("2026-10-08", "11:00:00", 8),
      b("2026-10-08", "16:00:00", 4, "attended"),
      b("2026-10-09", "11:00:00", 3),
      b("2026-10-09", "18:00:00", 2, "no_show"),
    ];
    const days = buildMonth("2026-10", schedule, [], bookings);
    expect(summarizeMonth(days, bookings)).toEqual({
      bookings: 3,
      people: 15,
      noShows: 1,
      busiest: { date: "2026-10-08", people: 12 },
    });
  });

  it("no busiest day in an empty month", () => {
    expect(summarizeMonth(buildMonth("2026-10", schedule, [], []), []).busiest).toBeNull();
  });
});
