import { describe, expect, it } from "vitest";
import { lastPickupDate, pieceTimeline, readyDate, type PieceStatus, type PieceTemplate } from "./pieceTimeline";
import { studioToUtc } from "./time";

// Checked in on 2026-10-01 at 19:30 studio time.
const checkedInAt = studioToUtc("2026-10-01", "19:30");
// Cron runs at 10:00 studio time on day N.
const onDay = (n: number) => new Date(studioToUtc("2026-10-01", "10:00").getTime() + n * 86_400_000);

function run(
  day: number,
  opts: { status?: PieceStatus; delayed?: boolean; readyAt?: Date | null; sent?: PieceTemplate[] } = {},
) {
  return pieceTimeline({
    checkedInAt,
    now: onDay(day),
    status: opts.status ?? "received",
    delayed: opts.delayed ?? false,
    readyAt: opts.readyAt ?? null,
    sent: new Set(opts.sent ?? []),
  });
}

/** Simulate the daily job from day 0 to `last`, applying actions; returns what was sent on which day. */
function simulate(last: number, opts: { delayedUntil?: number } = {}) {
  let status: PieceStatus = "received";
  let readyAt: Date | null = null;
  const sent = new Set<PieceTemplate>(["piece_received"]); // sent at check-in
  const log: string[] = [];
  for (let d = 0; d <= last; d++) {
    if (opts.delayedUntil !== undefined && d === opts.delayedUntil) {
      status = "ready"; // staff marks it ready
      readyAt = onDay(d);
    }
    const delayed = opts.delayedUntil !== undefined && d < opts.delayedUntil;
    const a = pieceTimeline({ checkedInAt, now: onDay(d), status, delayed, readyAt, sent });
    if (a.markReady) {
      status = "ready";
      readyAt = onDay(d);
    }
    if (a.send) {
      sent.add(a.send);
      log.push(`${d}:${a.send}`);
    }
    if (a.donate) {
      status = "donated";
      log.push(`${d}:donated`);
    }
  }
  return log;
}

describe("readyDate", () => {
  it("is check-in studio date + 14", () => {
    expect(readyDate(checkedInAt)).toBe("2026-10-15");
    // 23:30 studio on Oct 1 is already Oct 2 in UTC: still counts from Oct 1.
    expect(readyDate(studioToUtc("2026-10-01", "23:30"))).toBe("2026-10-15");
  });
});

describe("pieceTimeline: day by day", () => {
  it("day 0: received is due only if not already sent", () => {
    expect(run(0).send).toBe("piece_received");
    expect(run(0, { sent: ["piece_received"] }).send).toBeNull();
  });

  it("days 1–13: nothing new", () => {
    for (let d = 1; d <= 13; d++) expect(run(d, { sent: ["piece_received"] })).toMatchObject({ send: null, markReady: false, donate: false });
  });

  it("day 14: ready message and mark ready", () => {
    expect(run(14, { sent: ["piece_received"] })).toMatchObject({ day: 14, send: "piece_ready", markReady: true });
    expect(run(14, { status: "firing", sent: ["piece_received"] })).toMatchObject({ send: "piece_ready", markReady: true });
  });

  it("day 14 while delayed: nothing", () => {
    expect(run(14, { delayed: true, sent: ["piece_received"] })).toMatchObject({ send: null, markReady: false });
  });

  it("staff marks ready early (day 10): ready message goes out right away", () => {
    expect(run(10, { status: "ready", readyAt: onDay(10), sent: ["piece_received"] })).toMatchObject({ send: "piece_ready", markReady: false });
  });

  it("days 15–20: nothing new after ready", () => {
    for (let d = 15; d <= 20; d++) expect(run(d, { status: "ready", readyAt: onDay(14), sent: ["piece_received", "piece_ready"] }).send).toBeNull();
  });

  it("day 21 and day 30: pickup reminders", () => {
    const base = { status: "ready" as const, readyAt: onDay(14) };
    expect(run(21, { ...base, sent: ["piece_ready"] }).send).toBe("piece_reminder_21");
    expect(run(25, { ...base, sent: ["piece_ready", "piece_reminder_21"] }).send).toBeNull();
    expect(run(30, { ...base, sent: ["piece_ready", "piece_reminder_21"] }).send).toBe("piece_reminder_30");
  });

  it("day 40: final notice", () => {
    expect(run(40, { status: "ready", readyAt: onDay(14), sent: ["piece_ready", "piece_reminder_21", "piece_reminder_30"] }).send).toBe("piece_final_notice");
  });

  it("day 45: donate, no message", () => {
    const all: PieceTemplate[] = ["piece_received", "piece_ready", "piece_reminder_21", "piece_reminder_30", "piece_final_notice"];
    expect(run(44, { status: "ready", readyAt: onDay(14), sent: all })).toMatchObject({ send: null, donate: false });
    expect(run(45, { status: "ready", readyAt: onDay(14), sent: all })).toMatchObject({ send: null, donate: true });
  });

  it("never donates before the final notice was sent", () => {
    expect(run(45, { status: "ready", readyAt: onDay(14), sent: ["piece_ready"] })).toMatchObject({ send: "piece_final_notice", donate: false });
  });

  it("picked_up and donated stop everything", () => {
    for (const status of ["picked_up", "donated"] as const) {
      for (const d of [0, 14, 21, 30, 40, 45, 60]) expect(run(d, { status })).toMatchObject({ send: null, markReady: false, donate: false });
    }
  });

  it("missed days: sends only the latest milestone, never a backlog", () => {
    expect(run(33, { status: "ready", readyAt: onDay(14), sent: ["piece_ready"] }).send).toBe("piece_reminder_30");
  });
});

describe("pieceTimeline: full simulation", () => {
  it("normal piece: 14 ready, 21, 30, 40, donated at 45", () => {
    expect(simulate(60)).toEqual([
      "14:piece_ready",
      "21:piece_reminder_21",
      "30:piece_reminder_30",
      "40:piece_final_notice",
      "45:donated",
    ]);
  });

  it("delayed piece marked ready on day 20: pickup clock shifts by 6 days", () => {
    expect(simulate(60, { delayedUntil: 20 })).toEqual([
      "20:piece_ready",
      "27:piece_reminder_21",
      "36:piece_reminder_30",
      "46:piece_final_notice",
      "51:donated",
    ]);
  });
});

describe("lastPickupDate", () => {
  it("is the day before donation (day 44)", () => {
    expect(lastPickupDate(checkedInAt)).toBe("2026-11-14");
  });
  it("shifts for pieces that became ready late", () => {
    expect(lastPickupDate(checkedInAt, onDay(20))).toBe("2026-11-20");
    expect(lastPickupDate(checkedInAt, onDay(10))).toBe("2026-11-14");
  });
});
