"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { parseSettingsForm, settingsToRow } from "@/lib/finance/settings";
import type { FinanceSettings } from "@/lib/finance/types";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type SettingsResult =
  | { ok: true }
  | { ok: false; error: "generic" }
  | { ok: false; error: "fields"; fields: Partial<Record<keyof FinanceSettings, "required" | "invalid">> };

export async function saveSettings(values: Record<string, string>): Promise<SettingsResult> {
  await requireAdmin();
  const parsed = parseSettingsForm(values);
  if (!parsed.ok) return { ok: false, error: "fields", fields: parsed.errors };
  const { error } = await supabaseAdmin()
    .from("finance_settings")
    .update({ ...settingsToRow(parsed.settings), updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}
