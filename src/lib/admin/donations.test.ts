import { describe, expect, it } from "vitest";
import { studioToUtc } from "../time";
import { donationLists } from "./donations";
import type { AdminPiece } from "./pieceBoard";

const now = studioToUtc("2026-11-20", "10:00");
const base: AdminPiece = {
  id: "x",
  code: "C-0001",
  name: "Ana",
  phone: "+526860000000",
  email: "a@example.com",
  status: "ready",
  delayed: false,
  photo_path: null,
  checked_in_at: studioToUtc("2026-10-10", "18:00").toISOString(),
  ready_at: studioToUtc("2026-10-24", "10:00").toISOString(),
  picked_up_at: null,
};

describe("donationLists", () => {
  it("lists donated pieces and ready pieces within 5 days of their last day", () => {
    const lists = donationLists(
      [
        { ...base, id: "d", code: "C-0002", status: "donated", donated_at: studioToUtc("2026-11-19", "10:00").toISOString() },
        { ...base, id: "s" }, // last day 2026-11-23 → soon
        { ...base, id: "late", checked_in_at: studioToUtc("2026-11-01", "18:00").toISOString(), ready_at: null }, // far
        { ...base, id: "p", status: "picked_up" },
      ],
      now,
    );
    expect(lists.due.map((p) => [p.id, p.donatedOn])).toEqual([["d", "2026-11-19"]]);
    expect(lists.soon.map((p) => [p.id, p.lastDay])).toEqual([["s", "2026-11-23"]]);
  });
});
