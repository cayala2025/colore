import "server-only";
import { createElement } from "react";
import BookingConfirmation, { bookingConfirmationSubject } from "@/emails/BookingConfirmation";
import type { BookingEmailData } from "@/emails/BookingDetails";
import BookingReminder, { bookingReminderSubject } from "@/emails/BookingReminder";
import { PieceEmail, pieceEmailSubject, type PieceEmailKind } from "@/emails/PieceEmail";
import { notify, type NotifyOutcome } from "./notify";
import { lastPickupDate, readyDate, type PieceTemplate } from "./pieceTimeline";
import { supabaseAdmin } from "./supabase/admin";

// Template names stored in notifications_log.
export const BOOKING_CONFIRMATION = "booking_confirmation";
export const BOOKING_REMINDER = "booking_reminder";

export type BookingForEmail = {
  id: string;
  name: string;
  email: string;
  date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  manage_token: string;
};

function bookingData(b: BookingForEmail): BookingEmailData {
  return {
    name: b.name,
    date: b.date,
    start: b.start_time.slice(0, 5),
    end: b.end_time.slice(0, 5),
    party: b.party_size,
    manageToken: b.manage_token,
  };
}

export function sendBookingConfirmation(b: BookingForEmail): Promise<NotifyOutcome> {
  const data = bookingData(b);
  return notify({
    target: { bookingId: b.id },
    template: BOOKING_CONFIRMATION,
    to: b.email,
    subject: bookingConfirmationSubject(data),
    react: createElement(BookingConfirmation, data),
  });
}

export function sendBookingReminder(b: BookingForEmail): Promise<NotifyOutcome> {
  const data = bookingData(b);
  return notify({
    target: { bookingId: b.id },
    template: BOOKING_REMINDER,
    to: b.email,
    subject: bookingReminderSubject(),
    react: createElement(BookingReminder, data),
  });
}

export type PieceForEmail = {
  id: string;
  code: string;
  name: string;
  email: string;
  photo_path: string | null;
  checked_in_at: string;
  ready_at: string | null;
};

const PIECE_KIND: Record<PieceTemplate, PieceEmailKind> = {
  piece_received: "received",
  piece_ready: "ready",
  piece_reminder_21: "reminder",
  piece_reminder_30: "reminder",
  piece_final_notice: "finalNotice",
};

/** Photo link for emails: signed URL from the private bucket, valid for 60 days. */
async function photoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabaseAdmin().storage.from("pieces").createSignedUrl(path, 60 * 24 * 3600);
  return data?.signedUrl ?? null;
}

export async function sendPieceMessage(p: PieceForEmail, template: PieceTemplate): Promise<NotifyOutcome> {
  const checkedInAt = new Date(p.checked_in_at);
  const readyAt = p.ready_at ? new Date(p.ready_at) : null;
  const kind = PIECE_KIND[template];
  const data = {
    name: p.name,
    code: p.code,
    photoUrl: kind === "received" ? await photoUrl(p.photo_path) : null,
    readyDate: readyDate(checkedInAt),
    lastPickupDate: lastPickupDate(checkedInAt, readyAt),
  };
  return notify({
    target: { pieceId: p.id },
    template,
    to: p.email,
    subject: pieceEmailSubject(kind, data),
    react: createElement(PieceEmail, { kind, data }),
  });
}
