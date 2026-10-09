import { describe, expect, it } from "vitest";
import { book, fillUntil, seatsLeft, testDate } from "./helpers";

describe("seats are never oversold", () => {
  it("2 parallel bookings for the last seats → exactly one succeeds", async () => {
    const date = await testDate(0);
    await fillUntil(date, "20:00", 5);

    const results = await Promise.all([
      book({ date, start: "20:00", party: 4 }),
      book({ date, start: "20:00", party: 4 }),
    ]);

    expect(results.filter((r) => !r.error)).toHaveLength(1);
    expect(results.filter((r) => r.error?.message === "slot_full")).toHaveLength(1);
    expect(await seatsLeft(date, "20:00")).toBe(1);
  });

  it("a burst of 12 parallel bookings never exceeds capacity", async () => {
    const date = await testDate(1);
    await fillUntil(date, "11:00", 10);

    const results = await Promise.all(Array.from({ length: 12 }, () => book({ date, start: "11:00", party: 3 })));

    expect(results.filter((r) => !r.error)).toHaveLength(3); // 3 × 3 = 9 ≤ 10
    expect(results.filter((r) => r.error && r.error.message !== "slot_full")).toEqual([]);
    expect(await seatsLeft(date, "11:00")).toBe(1);
  });
});
