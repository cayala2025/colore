import { describe, expect, it } from "vitest";
import { formatDateLong, formatTimeRange } from "./format";

describe("format", () => {
  it("formats a long Spanish date", () => {
    expect(formatDateLong("2026-10-01")).toBe("jueves 1 de octubre");
    expect(formatDateLong("2026-10-04")).toBe("domingo 4 de octubre");
  });
  it("formats a time range and trims seconds", () => {
    expect(formatTimeRange("16:00:00", "18:00")).toBe("16:00 – 18:00");
  });
});
