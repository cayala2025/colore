import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cronAuth";
import { runBookingReminders } from "@/lib/jobs/bookingReminders";
import { runPieceTimeline } from "@/lib/jobs/pieceTimelineJob";

// Daily job (Vercel Cron, 17:00 UTC = 10:00 America/Tijuana). Safe to run more than once.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result: Record<string, unknown> = {};
  let ok = true;
  // Each part runs even if another one fails.
  try {
    result.bookingReminders = await runBookingReminders();
  } catch (err) {
    ok = false;
    console.error("[cron] booking reminders failed", err);
    result.bookingReminders = { error: String(err) };
  }
  try {
    result.pieceTimeline = await runPieceTimeline();
  } catch (err) {
    ok = false;
    console.error("[cron] piece timeline failed", err);
    result.pieceTimeline = { error: String(err) };
  }
  return NextResponse.json({ ok, ...result }, { status: ok ? 200 : 500 });
}
