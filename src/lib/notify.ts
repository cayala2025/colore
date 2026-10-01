import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReactElement } from "react";
import { emailSender, type EmailSender } from "./email";
import { supabaseAdmin } from "./supabase/admin";

export type NotifyTarget = { bookingId: string } | { pieceId: string };

export type NotifyInput = {
  target: NotifyTarget;
  template: string;
  to: string;
  subject: string;
  react: ReactElement;
};

export type NotifyOutcome = "sent" | "skipped" | "failed";

export const MAX_ATTEMPTS = 3;
const UNIQUE_VIOLATION = "23505";

type Deps = { db: SupabaseClient; send: EmailSender };

/**
 * Send a notification at most once per (target, template):
 * 1. Write the log row FIRST (unique index on target + template).
 * 2. If the row already exists: skip, unless it failed earlier and can be retried
 *    (claimed atomically, so two runs never both retry).
 * 3. Send, then record sent/failed.
 */
export function createNotifier({ db, send }: Deps) {
  return async function notify(input: NotifyInput): Promise<NotifyOutcome> {
    const targetCols =
      "bookingId" in input.target ? { booking_id: input.target.bookingId } : { piece_id: input.target.pieceId };

    let logId: string | null = null;
    const inserted = await db
      .from("notifications_log")
      .insert({ ...targetCols, template: input.template, channel: "email", recipient: input.to })
      .select("id")
      .single();

    if (inserted.error) {
      if (inserted.error.code !== UNIQUE_VIOLATION) throw new Error(`notify log insert: ${inserted.error.message}`);
      // Already logged. Retry only a failed send, and only if we win the claim.
      const [col, val] = Object.entries(targetCols)[0];
      const existing = await db
        .from("notifications_log")
        .select("id, status, attempts")
        .eq(col, val)
        .eq("template", input.template)
        .single();
      const row = existing.data as { id: string; status: string; attempts: number } | null;
      if (!row || row.status !== "failed" || row.attempts >= MAX_ATTEMPTS) return "skipped";
      const claimed = await db
        .from("notifications_log")
        .update({ status: "pending", attempts: row.attempts + 1, error: null, recipient: input.to })
        .eq("id", row.id)
        .eq("status", "failed")
        .eq("attempts", row.attempts)
        .select("id");
      if (!claimed.data?.length) return "skipped";
      logId = row.id;
    } else {
      logId = (inserted.data as { id: string }).id;
    }

    try {
      const { id } = await send({ to: input.to, subject: input.subject, react: input.react });
      await db
        .from("notifications_log")
        .update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: id })
        .eq("id", logId);
      return "sent";
    } catch (err) {
      console.error(`[notify] ${input.template} to ${input.to} failed`, err);
      await db
        .from("notifications_log")
        .update({ status: "failed", error: String(err).slice(0, 500) })
        .eq("id", logId);
      return "failed";
    }
  };
}

let defaultNotify: ReturnType<typeof createNotifier> | null = null;

export function notify(input: NotifyInput): Promise<NotifyOutcome> {
  defaultNotify ??= createNotifier({ db: supabaseAdmin(), send: emailSender() });
  return defaultNotify(input);
}
