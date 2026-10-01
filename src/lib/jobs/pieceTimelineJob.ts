import "server-only";
import { sendPieceMessage, type PieceForEmail } from "../messages";
import { MAX_ATTEMPTS } from "../notify";
import { PIECE_TEMPLATES, pieceTimeline, type PieceStatus, type PieceTemplate } from "../pieceTimeline";
import { supabaseAdmin } from "../supabase/admin";
import { emptyCounts, type JobCounts } from "./bookingReminders";

type PieceRow = PieceForEmail & { status: PieceStatus; delayed: boolean };
type LogRow = { piece_id: string; template: string; status: string; attempts: number };

export type PieceJobResult = JobCounts & { markedReady: number; donated: number };

/**
 * Templates that count as "done" for the timeline: sent or in flight, or failed too many times.
 * A failed message that can still be retried is not done, so it is tried again first.
 */
function doneTemplates(logs: LogRow[]): Set<PieceTemplate> {
  return new Set(
    logs
      .filter((l) => l.status !== "failed" || l.attempts >= MAX_ATTEMPTS)
      .map((l) => l.template)
      .filter((t): t is PieceTemplate => (PIECE_TEMPLATES as readonly string[]).includes(t)),
  );
}

/** Apply the piece timeline to every active piece. Idempotent: safe to run twice. */
export async function runPieceTimeline(now = new Date()): Promise<PieceJobResult> {
  const db = supabaseAdmin();
  const { data: pieces, error } = await db
    .from("pieces")
    .select("id, code, name, email, photo_path, checked_in_at, ready_at, status, delayed")
    .in("status", ["received", "firing", "ready"]);
  if (error) throw new Error(`pieces query failed: ${error.message}`);

  const result: PieceJobResult = { ...emptyCounts(), markedReady: 0, donated: 0 };
  const rows = (pieces ?? []) as PieceRow[];

  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const { data: logs, error: logError } = await db
      .from("notifications_log")
      .select("piece_id, template, status, attempts")
      .in(
        "piece_id",
        batch.map((p) => p.id),
      );
    if (logError) throw new Error(`notifications query failed: ${logError.message}`);

    for (const piece of batch) {
      const action = pieceTimeline({
        checkedInAt: new Date(piece.checked_in_at),
        now,
        status: piece.status,
        delayed: piece.delayed,
        readyAt: piece.ready_at ? new Date(piece.ready_at) : null,
        sent: doneTemplates(((logs ?? []) as LogRow[]).filter((l) => l.piece_id === piece.id)),
      });

      if (action.markReady) {
        const readyAt = now.toISOString();
        const { data } = await db
          .from("pieces")
          .update({ status: "ready", ready_at: readyAt, updated_at: readyAt })
          .eq("id", piece.id)
          .in("status", ["received", "firing"])
          .select("id");
        if (data?.length) {
          result.markedReady += 1;
          piece.ready_at = readyAt;
        }
      }

      if (action.send) result[await sendPieceMessage(piece, action.send)] += 1;

      if (action.donate) {
        const at = now.toISOString();
        const { data } = await db
          .from("pieces")
          .update({ status: "donated", donated_at: at, updated_at: at })
          .eq("id", piece.id)
          .eq("status", "ready")
          .select("id");
        if (data?.length) result.donated += 1;
      }
    }
  }
  return result;
}
