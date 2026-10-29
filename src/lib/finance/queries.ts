import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { settingsFromRow } from "./settings";
import type { FinanceSettings } from "./types";

/** The single finance_settings row (id = 1) as typed settings. */
export async function loadSettings(): Promise<FinanceSettings> {
  const { data, error } = await supabaseAdmin().from("finance_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`finance_settings: ${error.message}`);
  return settingsFromRow(data);
}
