import { NextResponse, type NextRequest } from "next/server";
import { COUNTRY_CODES, toE164, type CountryCode } from "@/lib/phone";
import { createRateLimiter } from "@/lib/rateLimit";
import { findTodaysBooking } from "@/lib/todaysBooking";

// Prefill for /pieza. Only today's bookings, and rate limited, to limit enumeration.
const allow = createRateLimiter(10, 60_000);

export async function POST(request: NextRequest) {
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "?";
  if (!allow(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { country?: string; phone?: string } | null;
  const country = body?.country as CountryCode;
  if (!COUNTRY_CODES.includes(country) || typeof body?.phone !== "string") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const phone = toE164(country, body.phone);
  if (!phone) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    const booking = await findTodaysBooking(phone);
    return NextResponse.json(
      { booking: booking ? { name: booking.name, email: booking.email } : null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
