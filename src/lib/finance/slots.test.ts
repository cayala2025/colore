import { describe, expect, it } from "vitest";
import { heatmap, isSlotClosed, slotLabelFor, weekRange } from "./slots";

describe("slotLabelFor", () => {
  it.each([
    ["11:00", "11–13"],
    ["12:59", "11–13"],
    ["13:00", "Fuera de turno"],
    ["16:00", "16–18"],
    ["18:00", "18–20"],
    ["20:30", "20–22"],
    ["22:00", "Fuera de turno"],
    ["09:00", "Fuera de turno"],
  ])("%s → %s", (time, label) => expect(slotLabelFor(time)).toBe(label));
});

describe("weekRange", () => {
  it("runs Monday to Sunday", () => {
    const w = weekRange("2026-10-29"); // Thursday
    expect(w.start).toBe("2026-10-26");
    expect(w.end).toBe("2026-11-01");
    expect(w.days).toHaveLength(7);
  });
  it("keeps a Sunday in its own week", () => {
    expect(weekRange("2026-11-01").start).toBe("2026-10-26");
  });
});

describe("isSlotClosed", () => {
  it("closes Monday, and 20–22 on Tue/Wed/Sun", () => {
    expect(isSlotClosed("2026-10-26", "11–13")).toBe(true); // Mon
    expect(isSlotClosed("2026-10-27", "20–22")).toBe(true); // Tue
    expect(isSlotClosed("2026-10-28", "20–22")).toBe(true); // Wed
    expect(isSlotClosed("2026-10-29", "20–22")).toBe(false); // Thu
    expect(isSlotClosed("2026-11-01", "20–22")).toBe(true); // Sun
    expect(isSlotClosed("2026-11-01", "18–20")).toBe(false);
  });
});

describe("heatmap", () => {
  it("sums pieces per day × slot", () => {
    const days = weekRange("2026-10-29").days;
    const h = heatmap(days, [
      { studioDate: "2026-10-29", slotLabel: "16–18", pieces: 2 },
      { studioDate: "2026-10-29", slotLabel: "16–18", pieces: 3 },
      { studioDate: "2026-10-30", slotLabel: "Fuera de turno", pieces: 9 },
    ]);
    expect(h.cells[3][1].pieces).toBe(5);
    expect(h.max).toBe(5);
  });
});

describe("slotLabelFor grace window", () => {
  it("counts early arrivals for the next slot", () => {
    expect(slotLabelFor("10:45", 30)).toBe("11–13");
    expect(slotLabelFor("15:30", 30)).toBe("16–18");
    expect(slotLabelFor("10:30", 30)).toBe("11–13");
  });
  it("does not stretch past the grace", () => {
    expect(slotLabelFor("10:29", 30)).toBe("Fuera de turno");
    expect(slotLabelFor("13:30", 30)).toBe("Fuera de turno");
  });
  it("is off by default", () => {
    expect(slotLabelFor("10:45")).toBe("Fuera de turno");
  });
});
