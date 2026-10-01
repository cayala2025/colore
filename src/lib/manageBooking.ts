import "server-only";
import { isManageToken } from "./manageRules";
import { supabaseAdmin } from "./supabase/admin";
import type { BookingStatus } from "./types";

export type ManagedBooking = {
  id: string;
  name: string;
  email: string;
  date: string;
  start_time: string;
  end_time: string;
  starts_at: string;
  party_size: number;
  status: BookingStatus;
  customer_confirmed_at: string | null;
  manage_token: string;
};

const COLUMNS = "id, name, email, date, start_time, end_time, starts_at, party_size, status, customer_confirmed_at, manage_token";

export async function getBookingByToken(token: string): Promise<ManagedBooking | null> {
  if (!isManageToken(token)) return null;
  const { data, error } = await supabaseAdmin().from("bookings").select(COLUMNS).eq("manage_token", token).maybeSingle();
  if (error) throw new Error(`booking lookup failed: ${error.message}`);
  return data as ManagedBooking | null;
}

/** Customer says "I'm coming". Only for upcoming confirmed bookings. */
export async function confirmBookingByToken(token: string): Promise<boolean> {
  if (!isManageToken(token)) return false;
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .update({ customer_confirmed_at: now, updated_at: now })
    .eq("manage_token", token)
    .eq("status", "confirmed")
    .gt("starts_at", now)
    .select("id");
  if (error) throw new Error(`confirm failed: ${error.message}`);
  return (data ?? []).length === 1;
}

/**
 * Customer cancels. Seats are freed because availability and create_booking only count
 * confirmed/attended bookings. Only upcoming confirmed bookings can be cancelled.
 */
export async function cancelBookingByToken(token: string): Promise<boolean> {
  if (!isManageToken(token)) return false;
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: now, updated_at: now })
    .eq("manage_token", token)
    .eq("status", "confirmed")
    .gt("starts_at", now)
    .select("id");
  if (error) throw new Error(`cancel failed: ${error.message}`);
  return (data ?? []).length === 1;
}
