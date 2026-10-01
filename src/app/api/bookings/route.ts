import { NextResponse, type NextRequest } from "next/server";
import { mapRpcError, statusFor, type BookingApiError } from "@/lib/bookingErrors";
import { parseBookingRequest } from "@/lib/bookingRequest";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";

const fail = (error: BookingApiError) => NextResponse.json({ error }, { status: statusFor(error) });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = parseBookingRequest(body);
  if (!parsed) return fail("invalid");

  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0];
  if (!(await verifyTurnstile(parsed.turnstileToken, ip))) return fail("turnstile");

  const { data, error } = await supabaseAdmin().rpc("create_booking", {
    p_date: parsed.date,
    p_start_time: parsed.start,
    p_party_size: parsed.party,
    p_name: parsed.name,
    p_phone: parsed.phone,
    p_email: parsed.email,
    p_whatsapp_opt_in: parsed.whatsappOptIn,
  });
  if (error) {
    const code = mapRpcError(error.message);
    if (code === "generic") console.error("[bookings] create_booking failed", error);
    return fail(code);
  }

  const row = (data as { id: string; date: string; start_time: string; end_time: string; party_size: number }[])[0];
  return NextResponse.json(
    {
      booking: {
        id: row.id,
        date: row.date,
        start: row.start_time.slice(0, 5),
        end: row.end_time.slice(0, 5),
        party: row.party_size,
      },
    },
    { status: 201 },
  );
}
