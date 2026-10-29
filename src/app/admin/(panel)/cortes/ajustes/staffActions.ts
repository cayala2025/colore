"use server";

import { refresh } from "next/cache";
import { isAdminEmail, requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function setStaffAccess(email: string, active: boolean): Promise<{ ok: true } | { ok: false; error: "invalid" | "isAdmin" | "generic" }> {
  const admin = await requireAdmin();
  const clean = email.trim().toLowerCase();
  if (!EMAIL.test(clean)) return { ok: false, error: "invalid" };
  if (await isAdminEmail(clean)) return { ok: false, error: "isAdmin" };
  const { error } = await supabaseAdmin().from("staff").upsert({ email: clean, active, added_by: admin.email }, { onConflict: "email" });
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}
