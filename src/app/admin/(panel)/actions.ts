"use server";

import { refresh } from "next/cache";
import { canTransition } from "@/lib/admin/bookingTransitions";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BookingStatus } from "@/lib/types";

const STATUSES: BookingStatus[] = ["confirmed", "attended", "no_show", "cancelled"];

export async function setBookingStatus(bookingId: string, to: BookingStatus): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!STATUSES.includes(to)) return { ok: false };
  const db = supabaseAdmin();
  const { data: current } = await db.from("bookings").select("status").eq("id", bookingId).maybeSingle();
  if (!current || !canTransition(current.status as BookingStatus, to)) return { ok: false };

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("bookings")
    .update({ status: to, updated_at: now, ...(to === "cancelled" ? { cancelled_at: now } : {}) })
    .eq("id", bookingId)
    .eq("status", current.status) // no lost updates if two staff click at once
    .select("id");
  if (error || !data?.length) return { ok: false };
  refresh();
  return { ok: true };
}
