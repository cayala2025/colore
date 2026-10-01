import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cronAuth";

// Daily job (Vercel Cron, 17:00 UTC = 10:00 America/Tijuana). Safe to run more than once.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
