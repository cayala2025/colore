"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { buildDayCut, closeValues, type CloseChecks } from "@/lib/finance/dayCut";
import { loadSaleLites, loadSettings } from "@/lib/finance/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type CloseResult = { ok: true } | { ok: false; error: "salesChanged" | "invalid" | "generic" };

export type CloseInput = {
  date: string;
  /** Cash counted in the drawer; null when not counted yet. */
  counted: number | null;
  checks: CloseChecks;
  notes: string;
  /** Total the screen showed; the close is refused if sales changed since. */
  seenTotal: number;
};

/** The cut is recomputed on the server from the database; the screen only supplies what staff typed. */
export async function closeDayAction(input: CloseInput): Promise<CloseResult> {
  const admin = await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: "invalid" };
  if (input.counted !== null && (!Number.isFinite(input.counted) || input.counted < 0)) return { ok: false, error: "invalid" };

  const [settings, sales] = await Promise.all([loadSettings(), loadSaleLites(input.date, input.date)]);
  const cut = buildDayCut(sales, settings, settings.cashFloatMxn, input.counted);
  if (Math.abs(cut.total - input.seenTotal) > 0.004) return { ok: false, error: "salesChanged" };

  const { error } = await supabaseAdmin().rpc("close_day", {
    p_studio_date: input.date,
    p_values: closeValues(cut, input.checks, input.notes.slice(0, 500)),
    p_closed_by: admin.email,
  });
  if (error) return { ok: false, error: error.message.includes("sales_changed") ? "salesChanged" : "generic" };
  refresh();
  return { ok: true };
}

export async function reopenDayAction(date: string): Promise<CloseResult> {
  await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "invalid" };
  const { error } = await supabaseAdmin()
    .from("daily_closes")
    .update({ reopened_at: new Date().toISOString() })
    .eq("studio_date", date)
    .is("reopened_at", null);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}
