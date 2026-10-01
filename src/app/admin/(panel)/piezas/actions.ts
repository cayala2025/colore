"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { ACTION_FROM, actionUpdate, PIECE_ACTIONS, type PieceAction } from "@/lib/admin/pieceTransitions";
import { requireAdmin } from "@/lib/adminAuth";
import { sendPieceMessage, type PieceForEmail } from "@/lib/messages";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Apply a staff action to one or many pieces. Only pieces in an allowed status change. */
export async function applyPieceAction(ids: string[], action: PieceAction): Promise<{ ok: boolean; changed: number }> {
  await requireAdmin();
  if (!PIECE_ACTIONS.includes(action) || ids.length === 0 || ids.length > 200) return { ok: false, changed: 0 };
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin()
    .from("pieces")
    .update({ ...actionUpdate(action, now), updated_at: now })
    .in("id", ids)
    .in("status", ACTION_FROM[action])
    .select("id, code, name, email, photo_path, checked_in_at, ready_at");
  if (error) return { ok: false, changed: 0 };

  if (action === "ready" && data?.length) {
    // "Tu pieza está lista" right away (logged first; never sent twice).
    const pieces = data as PieceForEmail[];
    after(async () => {
      for (const p of pieces) {
        await sendPieceMessage(p, "piece_ready").catch((err) => console.error("[admin] ready email failed", err));
      }
    });
  }
  refresh();
  return { ok: true, changed: data?.length ?? 0 };
}
