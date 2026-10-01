import { NextResponse, type NextRequest } from "next/server";
import { toPublicDays } from "@/lib/availability";
import { getMonthAvailability } from "@/lib/availabilityQuery";
import { MAX_ONLINE_PARTY } from "@/lib/bookingWindow";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month") ?? "";
  const party = Number(request.nextUrl.searchParams.get("party"));

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: "invalid_month" }, { status: 400 });
  }
  if (!Number.isInteger(party) || party < 1 || party > MAX_ONLINE_PARTY) {
    return NextResponse.json({ error: "invalid_party" }, { status: 400 });
  }

  try {
    const days = toPublicDays(await getMonthAvailability(month, party), party);
    return NextResponse.json({ month, party, days }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
