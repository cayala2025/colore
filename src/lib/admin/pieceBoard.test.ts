import { describe, expect, it } from "vitest";
import { groupPiecesByColumn, type AdminPiece } from "./pieceBoard";

const now = new Date("2026-10-20T17:00:00Z");
const piece = (code: string, status: AdminPiece["status"], checkedIn: string, pickedUp: string | null = null): AdminPiece => ({
  id: code,
  code,
  name: "Ana",
  phone: "+526860000000",
  email: "a@example.com",
  status,
  delayed: false,
  photo_path: null,
  checked_in_at: checkedIn,
  ready_at: null,
  picked_up_at: pickedUp,
});

describe("groupPiecesByColumn", () => {
  it("groups by status, oldest first, with day count", () => {
    const board = groupPiecesByColumn(
      [
        piece("C-0002", "received", "2026-10-15T18:00:00Z"),
        piece("C-0001", "received", "2026-10-06T18:00:00Z"),
        piece("C-0003", "firing", "2026-10-10T18:00:00Z"),
        piece("C-0004", "ready", "2026-10-01T18:00:00Z"),
      ],
      now,
    );
    expect(board.received.map((p) => p.code)).toEqual(["C-0001", "C-0002"]);
    expect(board.received[0].day).toBe(14);
    expect(board.firing.map((p) => p.code)).toEqual(["C-0003"]);
    expect(board.ready.map((p) => p.code)).toEqual(["C-0004"]);
  });

  it("shows only recent pickups and never donated pieces", () => {
    const board = groupPiecesByColumn(
      [
        piece("C-0005", "picked_up", "2026-09-01T18:00:00Z", "2026-10-18T18:00:00Z"),
        piece("C-0006", "picked_up", "2026-09-01T18:00:00Z", "2026-10-01T18:00:00Z"),
        piece("C-0007", "donated", "2026-08-01T18:00:00Z"),
      ],
      now,
    );
    expect(board.picked_up.map((p) => p.code)).toEqual(["C-0005"]);
    expect(Object.values(board).flat().map((p) => p.code)).not.toContain("C-0007");
  });
});
