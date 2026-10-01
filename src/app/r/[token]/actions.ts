"use server";

import { refresh } from "next/cache";
import { confirmBookingByToken } from "@/lib/manageBooking";

export type ManageActionState = { ok: boolean; error: boolean };

export async function confirmAction(token: string): Promise<ManageActionState> {
  const ok = await confirmBookingByToken(token).catch(() => false);
  if (ok) refresh();
  return { ok, error: !ok };
}
