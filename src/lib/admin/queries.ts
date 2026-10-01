import "server-only";
import type { ScheduleSlotRow } from "../availability";
import { addDays, isoWeekday } from "../calendar";
import { supabaseAdmin } from "../supabase/admin";
import { groupBookingsBySlot, type AdminBooking, type AdminSlot } from "./daySlots";
import { PICKED_UP_VISIBLE_DAYS, type AdminPiece } from "./pieceBoard";
import { needsReview } from "../pieceTimeline";
import { noShowCount } from "./noShows";
import { parsePieceQuery, pieceQueryFilter } from "./pieceSearch";
import { buildWeek, type AdminWeekDay } from "./week";

export const ADMIN_BOOKING_COLUMNS =
  "id, name, phone, email, party_size, status, start_time, end_time, customer_confirmed_at, manage_token, date";

export type AdminDay = {
  date: string;
  /** Past no-shows per booking id (only bookings with at least one). */
  noShows: Record<string, number>;
  blocked: { reason: string | null } | null;
  slots: AdminSlot[];
};

export async function getAdminDay(date: string): Promise<AdminDay> {
  const db = supabaseAdmin();
  const [schedule, blocked, bookings] = await Promise.all([
    db.from("schedule_slots").select("weekday, start_time, end_time, capacity, active").eq("weekday", isoWeekday(date)),
    db.from("blocked_dates").select("reason").eq("date", date).maybeSingle(),
    db.from("bookings").select(ADMIN_BOOKING_COLUMNS).eq("date", date),
  ]);
  const error = schedule.error ?? blocked.error ?? bookings.error;
  if (error) throw new Error(`admin day query failed: ${error.message}`);
  const dayBookings = bookings.data as AdminBooking[];
  const phones = [...new Set(dayBookings.map((b) => b.phone))];
  const history = phones.length
    ? await db.from("bookings").select("id, phone, status").in("phone", phones).eq("status", "no_show")
    : { data: [] };
  const noShows: Record<string, number> = {};
  for (const b of dayBookings) {
    const n = noShowCount((history.data ?? []) as { id: string; phone: string; status: string }[], b);
    if (n > 0) noShows[b.id] = n;
  }

  return {
    date,
    noShows,
    blocked: blocked.data ? { reason: (blocked.data as { reason: string | null }).reason } : null,
    slots: groupBookingsBySlot(schedule.data as ScheduleSlotRow[], dayBookings),
  };
}

export async function getAdminWeek(monday: string): Promise<AdminWeekDay[]> {
  const db = supabaseAdmin();
  const sunday = addDays(monday, 6);
  const [schedule, blocked, bookings] = await Promise.all([
    db.from("schedule_slots").select("weekday, start_time, end_time, capacity, active"),
    db.from("blocked_dates").select("date").gte("date", monday).lte("date", sunday),
    db
      .from("bookings")
      .select(ADMIN_BOOKING_COLUMNS)
      .gte("date", monday)
      .lte("date", sunday)
      .in("status", ["confirmed", "attended", "no_show"]),
  ]);
  const error = schedule.error ?? blocked.error ?? bookings.error;
  if (error) throw new Error(`admin week query failed: ${error.message}`);
  return buildWeek(
    monday,
    schedule.data as ScheduleSlotRow[],
    (blocked.data ?? []).map((b) => b.date as string),
    bookings.data as AdminBooking[],
  );
}

export const ADMIN_PIECE_COLUMNS =
  "id, code, name, phone, email, status, delayed, photo_path, checked_in_at, ready_at, picked_up_at";

/** Active pieces plus recent pickups, for the board. */
export async function getBoardPieces(): Promise<AdminPiece[]> {
  const db = supabaseAdmin();
  const since = new Date(Date.now() - (PICKED_UP_VISIBLE_DAYS + 1) * 86_400_000).toISOString();
  const [active, picked] = await Promise.all([
    db.from("pieces").select(ADMIN_PIECE_COLUMNS).in("status", ["received", "firing", "ready"]),
    db.from("pieces").select(ADMIN_PIECE_COLUMNS).eq("status", "picked_up").gte("picked_up_at", since),
  ]);
  const error = active.error ?? picked.error;
  if (error) throw new Error(`pieces query failed: ${error.message}`);
  return [...(active.data ?? []), ...(picked.data ?? [])] as AdminPiece[];
}

/** Short-lived signed URLs for piece photos (private bucket), keyed by path. */
export async function signedPhotoUrls(paths: (string | null)[], expiresIn = 3600): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (!unique.length) return {};
  const { data } = await supabaseAdmin().storage.from("pieces").createSignedUrls(unique, expiresIn);
  const urls: Record<string, string> = {};
  for (const d of data ?? []) if (d.path && d.signedUrl) urls[d.path] = d.signedUrl;
  return urls;
}

/** Search all pieces (any status) by code, phone or name. Newest first, max 50. */
export async function searchPieces(raw: string): Promise<AdminPiece[]> {
  const filter = pieceQueryFilter(parsePieceQuery(raw));
  if (!filter) return [];
  const { data, error } = await supabaseAdmin()
    .from("pieces")
    .select(ADMIN_PIECE_COLUMNS)
    .or(filter)
    .order("checked_in_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`piece search failed: ${error.message}`);
  return (data ?? []) as AdminPiece[];
}

/** Pieces for the "Por donar" page: donated in the last 30 days, and ready pieces near their last day. */
export async function getDonationPieces() {
  const db = supabaseAdmin();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [donated, ready] = await Promise.all([
    db.from("pieces").select(`${ADMIN_PIECE_COLUMNS}, donated_at`).eq("status", "donated").gte("donated_at", since),
    db.from("pieces").select(`${ADMIN_PIECE_COLUMNS}, donated_at`).eq("status", "ready"),
  ]);
  const error = donated.error ?? ready.error;
  if (error) throw new Error(`donation query failed: ${error.message}`);
  return [...(donated.data ?? []), ...(ready.data ?? [])] as (AdminPiece & { donated_at: string | null })[];
}

/** Pieces not marked ready although 14 days have passed (admin "Revisar" list). */
export async function getReviewPieces(now = new Date()): Promise<AdminPiece[]> {
  const { data, error } = await supabaseAdmin()
    .from("pieces")
    .select(ADMIN_PIECE_COLUMNS)
    .in("status", ["received", "firing"])
    .order("checked_in_at");
  if (error) throw new Error(`review query failed: ${error.message}`);
  return ((data ?? []) as AdminPiece[]).filter((p) => needsReview({ status: p.status, checkedInAt: new Date(p.checked_in_at) }, now));
}
