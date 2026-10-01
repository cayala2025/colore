"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { todayInStudio } from "@/lib/time";

export type BlockResult =
  | { ok: true; bookings: number }
  | { ok: false; error: "date" | "duplicate" | "generic" };

export async function addBlockedDate(date: string, reason: string): Promise<BlockResult> {
  await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayInStudio()) return { ok: false, error: "date" };
  const db = supabaseAdmin();
  const { error } = await db.from("blocked_dates").insert({ date, reason: reason.trim().slice(0, 200) || null });
  if (error) return { ok: false, error: error.code === "23505" ? "duplicate" : "generic" };
  const { count } = await db
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("date", date)
    .eq("status", "confirmed");
  refresh();
  return { ok: true, bookings: count ?? 0 };
}

export async function removeBlockedDate(date: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const { error } = await supabaseAdmin().from("blocked_dates").delete().eq("date", date);
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}
