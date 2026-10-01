"use server";

import { refresh } from "next/cache";
import { validateSlotInput, type SlotInput } from "@/lib/admin/slotInput";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { todayInStudio } from "@/lib/time";

export type SlotResult = { ok: true } | { ok: false; error: "time" | "capacity" | "duplicate" | "hasBookings" | "generic" };

export async function updateSlot(id: number, input: SlotInput): Promise<SlotResult> {
  await requireAdmin();
  const invalid = validateSlotInput(input);
  if (invalid) return { ok: false, error: invalid };
  const db = supabaseAdmin();

  const { data: current } = await db.from("schedule_slots").select("weekday, start_time").eq("id", id).maybeSingle();
  if (!current) return { ok: false, error: "generic" };

  // Changing the time would orphan upcoming bookings at the old time.
  if ((current.start_time as string).slice(0, 5) !== input.start) {
    const { data: upcoming } = await db
      .from("bookings")
      .select("id, date")
      .eq("start_time", current.start_time)
      .eq("status", "confirmed")
      .gte("date", todayInStudio());
    const sameWeekday = (upcoming ?? []).filter(
      (b) => ((new Date(`${b.date}T12:00:00Z`).getUTCDay() + 6) % 7) + 1 === current.weekday,
    );
    if (sameWeekday.length) return { ok: false, error: "hasBookings" };
  }

  const { error } = await db
    .from("schedule_slots")
    .update({ start_time: input.start, end_time: input.end, capacity: input.capacity, active: input.active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.code === "23505" ? "duplicate" : "generic" };
  refresh();
  return { ok: true };
}

export async function createSlot(weekday: number, input: SlotInput): Promise<SlotResult> {
  await requireAdmin();
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) return { ok: false, error: "generic" };
  const invalid = validateSlotInput(input);
  if (invalid) return { ok: false, error: invalid };
  const { error } = await supabaseAdmin()
    .from("schedule_slots")
    .insert({ weekday, start_time: input.start, end_time: input.end, capacity: input.capacity, active: input.active });
  if (error) return { ok: false, error: error.code === "23505" ? "duplicate" : "generic" };
  refresh();
  return { ok: true };
}
