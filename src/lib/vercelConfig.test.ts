import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { studioToUtc } from "./time";

describe("vercel.json cron", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8")) as { crons: { path: string; schedule: string }[] };

  it("runs the daily job once a day at 17:00 UTC", () => {
    expect(config.crons).toEqual([{ path: "/api/cron/daily", schedule: "0 17 * * *" }]);
  });

  it("17:00 UTC is 10:00 in Mexicali during daylight time (9:00 in winter)", () => {
    expect(studioToUtc("2026-07-01", "10:00").getUTCHours()).toBe(17);
    expect(studioToUtc("2026-12-01", "09:00").getUTCHours()).toBe(17);
  });
});
