"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { hashDiscountCode, MIN_CODE_LENGTH } from "@/lib/finance/discountCode";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function saveDiscountCode(code: string): Promise<{ ok: true } | { ok: false; error: "tooShort" | "generic" }> {
  await requireAdmin();
  if (code.trim().length < MIN_CODE_LENGTH) return { ok: false, error: "tooShort" };
  const { error } = await supabaseAdmin()
    .from("finance_settings")
    .update({ discount_code_hash: hashDiscountCode(code.trim()), updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}
