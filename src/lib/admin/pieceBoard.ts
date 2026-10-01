import type { PieceStatus } from "../pieceTimeline";
import { studioDaysBetween } from "../time";

export type AdminPiece = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  status: PieceStatus;
  delayed: boolean;
  photo_path: string | null;
  checked_in_at: string;
  ready_at: string | null;
  picked_up_at: string | null;
};

export type BoardColumn = "received" | "firing" | "ready" | "picked_up";
export const BOARD_COLUMNS: BoardColumn[] = ["received", "firing", "ready", "picked_up"];

/** Show picked-up pieces on the board for this many days. */
export const PICKED_UP_VISIBLE_DAYS = 7;

export type BoardPiece = AdminPiece & { day: number };

/** Group pieces into board columns; oldest first (they need attention first). */
export function groupPiecesByColumn(pieces: AdminPiece[], now: Date): Record<BoardColumn, BoardPiece[]> {
  const board: Record<BoardColumn, BoardPiece[]> = { received: [], firing: [], ready: [], picked_up: [] };
  for (const p of pieces) {
    if (p.status === "donated") continue;
    if (p.status === "picked_up" && (!p.picked_up_at || studioDaysBetween(new Date(p.picked_up_at), now) > PICKED_UP_VISIBLE_DAYS)) {
      continue;
    }
    board[p.status].push({ ...p, day: studioDaysBetween(new Date(p.checked_in_at), now) });
  }
  for (const col of BOARD_COLUMNS) board[col].sort((a, b) => a.checked_in_at.localeCompare(b.checked_in_at));
  board.picked_up.reverse(); // most recent pickups first
  return board;
}
