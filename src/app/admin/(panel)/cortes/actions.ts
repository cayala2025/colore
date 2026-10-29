"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { weekdayMon0 } from "@/lib/calendar";
import { weekRange } from "@/lib/finance/slots";
import { summarizeWeek } from "@/lib/finance/summaries";
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

export type WeekChecklist = { closes: boolean; paint: boolean; glaze: boolean; order: boolean; profit: boolean };

export async function closeWeekAction(weekStart: string, checklist: WeekChecklist, notes: string): Promise<{ ok: boolean }> {
  const admin = await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart) || weekdayMon0(weekStart) !== 0) return { ok: false };
  const range = weekRange(weekStart);
  const [settings, sales] = await Promise.all([loadSettings(), loadSaleLites(range.start, range.end)]);
  const w = summarizeWeek(sales, range.days, [], settings);
  const { error } = await supabaseAdmin()
    .from("weekly_closes")
    .upsert({
      week_start: weekStart,
      pieces: w.pieces,
      customers: w.pieces,
      total_mxn: Math.round(w.total * 100) / 100,
      taxes_mxn: Math.round(w.split.taxes * 100) / 100,
      inventory_mxn: Math.round(w.split.inventory * 100) / 100,
      fixed_mxn: Math.round(w.split.fixed * 100) / 100,
      profit_mxn: Math.round(w.split.profit * 100) / 100,
      checklist,
      notes: notes.trim().slice(0, 500) || null,
      closed_by: admin.email,
      closed_at: new Date().toISOString(),
    });
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}

export type ExpenseInput = { spentOn: string; category: string; amountMxn: number; note: string };
const CATEGORIES = ["rent", "electricity", "water", "payroll", "marketing", "accounting", "other"];

function validExpense(e: ExpenseInput): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(e.spentOn) && CATEGORIES.includes(e.category) && Number.isFinite(e.amountMxn) && e.amountMxn >= 0 && e.amountMxn < 100_000_000;
}

export async function addExpenseAction(e: ExpenseInput): Promise<{ ok: boolean }> {
  const admin = await requireAdmin();
  if (!validExpense(e)) return { ok: false };
  const { error } = await supabaseAdmin()
    .from("expenses")
    .insert({ spent_on: e.spentOn, category: e.category, amount_mxn: e.amountMxn, note: e.note.trim().slice(0, 200) || null, created_by: admin.email });
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}

export async function updateExpenseAction(id: string, e: ExpenseInput): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!validExpense(e)) return { ok: false };
  const { error } = await supabaseAdmin()
    .from("expenses")
    .update({ spent_on: e.spentOn, category: e.category, amount_mxn: e.amountMxn, note: e.note.trim().slice(0, 200) || null })
    .eq("id", id);
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}
