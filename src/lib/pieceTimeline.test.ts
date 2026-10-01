import { describe, expect, it } from "vitest";
import {
  lastPickupDate,
  needsReview,
  pieceTimeline,
  readyDate,
  type PieceStatus,
  type PieceTemplate,
} from "./pieceTimeline";
import { studioToUtc } from "./time";

// Checked in on 2026-10-01 at 19:30 studio time.
const checkedInAt = studioToUtc("2026-10-01", "19:30");
// Cron runs at 10:00 studio time on day N.
const onDay = (n: number) => new Date(studioToUtc("2026-10-01", "10:00").getTime() + n * 86_400_000);
const ALL: PieceTemplate[] = ["piece_received", "piece_ready", "piece_reminder_21", "piece_reminder_30", "piece_final_notice"];

function run(day: number, opts: { status?: PieceStatus; readyDay?: number; sent?: PieceTemplate[]; sentToday?: boolean } = {}) {
  return pieceTimeline({
    checkedInAt,
    now: onDay(day),
    status: opts.status ?? "received",
    readyAt: opts.readyDay === undefined ? null : onDay(opts.readyDay),
    sent: new Set(opts.sent ?? []),
    sentToday: opts.sentToday,
  });
}

/** Simulate the daily job from day 0 to `last`; staff marks the piece ready on `readyOn` (sending "lista" then). */
function simulate(last: number, readyOn: number) {
  let status: PieceStatus = "received";
  let readyAt: Date | null = null;
  const sent = new Set<PieceTemplate>(["piece_received"]); // sent at check-in
  const log: string[] = [];
  for (let d = 0; d <= last; d++) {
    if (d === readyOn) {
      status = "ready";
      readyAt = onDay(d);
      sent.add("piece_ready"); // admin "Marcar lista" sends it right away
      log.push(`${d}:piece_ready`);
      continue; // one message per day
    }
    const a = pieceTimeline({ checkedInAt, now: onDay(d), status, readyAt, sent });
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

describe("readyDate / lastPickupDate", () => {
  it("ready date is check-in studio date + 14", () => {
    expect(readyDate(checkedInAt)).toBe("2026-10-15");
    expect(readyDate(studioToUtc("2026-10-01", "23:30"))).toBe("2026-10-15");
  });
  it("last pickup day is ready + 30 (donation at ready + 31)", () => {
    expect(lastPickupDate(checkedInAt, onDay(14))).toBe("2026-11-14");
    expect(lastPickupDate(checkedInAt, onDay(20))).toBe("2026-11-20");
    expect(lastPickupDate(checkedInAt, onDay(10))).toBe("2026-11-10");
  });
});

describe("pieceTimeline", () => {
  it("not ready: only the 'received' backup, never 'lista', at any day", () => {
    expect(run(0).send).toBe("piece_received");
    for (const d of [1, 13, 14, 20, 45, 60]) {
      for (const status of ["received", "firing"] as const) {
        expect(run(d, { status, sent: ["piece_received"] })).toEqual({ day: d, send: null, donate: false });
      }
    }
  });

  it("ready: 'lista' is sent (backup) if the instant send didn't happen", () => {
    expect(run(15, { status: "ready", readyDay: 15, sent: ["piece_received"] }).send).toBe("piece_ready");
  });

  it("reminders at ready + 7 and + 16, final notice at + 26, donation at + 31", () => {
    const base = { status: "ready" as const, readyDay: 14 };
    expect(run(20, { ...base, sent: ALL.slice(0, 2) }).send).toBeNull();
    expect(run(21, { ...base, sent: ALL.slice(0, 2) }).send).toBe("piece_reminder_21");
    expect(run(30, { ...base, sent: ALL.slice(0, 3) }).send).toBe("piece_reminder_30");
    expect(run(40, { ...base, sent: ALL.slice(0, 4) }).send).toBe("piece_final_notice");
    expect(run(44, { ...base, sent: ALL })).toMatchObject({ send: null, donate: false });
    expect(run(45, { ...base, sent: ALL })).toMatchObject({ send: null, donate: true });
  });

  it("counts from the ready date for pieces marked ready early or late", () => {
    expect(run(17, { status: "ready", readyDay: 10, sent: ALL.slice(0, 2) }).send).toBe("piece_reminder_21");
    expect(run(26, { status: "ready", readyDay: 20, sent: ALL.slice(0, 2) }).send).toBeNull();
    expect(run(27, { status: "ready", readyDay: 20, sent: ALL.slice(0, 2) }).send).toBe("piece_reminder_21");
  });

  it("never donates before the final notice was sent", () => {
    expect(run(45, { status: "ready", readyDay: 14, sent: ["piece_ready"] })).toMatchObject({ send: "piece_final_notice", donate: false });
  });

  it("missed days: sends only the latest milestone, never a backlog", () => {
    expect(run(33, { status: "ready", readyDay: 14, sent: ["piece_ready"] }).send).toBe("piece_reminder_30");
  });

  it("never sends a second message on the same day, but still donates", () => {
    expect(run(21, { status: "ready", readyDay: 14, sent: ["piece_ready"], sentToday: true }).send).toBeNull();
    expect(run(45, { status: "ready", readyDay: 14, sent: ALL, sentToday: true }).donate).toBe(true);
  });

  it("picked_up and donated stop everything", () => {
    for (const status of ["picked_up", "donated"] as const) {
      for (const d of [0, 14, 21, 30, 40, 45, 60]) expect(run(d, { status })).toMatchObject({ send: null, donate: false });
    }
  });
});

describe("full simulation", () => {
  it("marked ready on day 14: 21, 30, 40, donated at 45", () => {
    expect(simulate(60, 14)).toEqual(["14:piece_ready", "21:piece_reminder_21", "30:piece_reminder_30", "40:piece_final_notice", "45:donated"]);
  });
  it("marked ready on day 20: everything shifts 6 days (31 days to donation)", () => {
    expect(simulate(60, 20)).toEqual(["20:piece_ready", "27:piece_reminder_21", "36:piece_reminder_30", "46:piece_final_notice", "51:donated"]);
  });
  it("never marked ready: only the check-in message, ever", () => {
    expect(simulate(90, 999)).toEqual([]);
  });
});

describe("needsReview", () => {
  it("flags pieces not ready after 14 days", () => {
    expect(needsReview({ status: "received", checkedInAt }, onDay(13))).toBe(false);
    expect(needsReview({ status: "firing", checkedInAt }, onDay(14))).toBe(true);
    expect(needsReview({ status: "ready", checkedInAt }, onDay(20))).toBe(false);
    expect(needsReview({ status: "picked_up", checkedInAt }, onDay(20))).toBe(false);
  });
});
