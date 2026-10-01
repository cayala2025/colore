import { describe, expect, it } from "vitest";
import { studioDaysBetween, studioToUtc, todayInStudio, toStudio } from "./time";

describe("time helpers (America/Tijuana)", () => {
  it("today in studio differs from UTC date in the evening", () => {
    // 2026-10-01 03:00 UTC = 2026-09-30 20:00 PDT
    expect(todayInStudio(new Date("2026-10-01T03:00:00Z"))).toBe("2026-09-30");
    expect(todayInStudio(new Date("2026-10-01T08:00:00Z"))).toBe("2026-10-01");
  });

  it("converts studio wall time to UTC in summer (PDT, UTC-7)", () => {
    expect(studioToUtc("2026-07-15", "16:00").toISOString()).toBe("2026-07-15T23:00:00.000Z");
  });

  it("converts studio wall time to UTC in winter (PST, UTC-8)", () => {
    expect(studioToUtc("2026-12-15", "20:00").toISOString()).toBe("2026-12-16T04:00:00.000Z");
  });

  it("handles the DST change days", () => {
    // 2026-03-08 DST starts at 02:00; 11:00 is PDT.
    expect(studioToUtc("2026-03-08", "11:00").toISOString()).toBe("2026-03-08T18:00:00.000Z");
    // 2026-11-01 DST ends at 02:00; 11:00 is PST.
    expect(studioToUtc("2026-11-01", "11:00").toISOString()).toBe("2026-11-01T19:00:00.000Z");
  });

  it("round-trips through toStudio", () => {
    expect(toStudio(studioToUtc("2026-10-04", "18:00"))).toEqual({ date: "2026-10-04", time: "18:00" });
  });

  it("counts studio calendar days, not 24h blocks", () => {
    const checkIn = new Date("2026-10-01T05:30:00Z"); // 2026-09-30 22:30 studio
    expect(studioDaysBetween(checkIn, new Date("2026-10-01T17:00:00Z"))).toBe(1);
    expect(studioDaysBetween(checkIn, new Date("2026-10-14T17:00:00Z"))).toBe(14);
  });

  it("does not depend on the process timezone (npm test runs with TZ=Asia/Tokyo)", () => {
    expect(studioToUtc("2026-10-04", "11:00").getTime()).toBe(Date.parse("2026-10-04T18:00:00Z"));
  });
});
