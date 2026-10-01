import { after, NextResponse, type NextRequest } from "next/server";
import { sendPieceMessage } from "@/lib/messages";
import { isAcceptablePhoto, parsePieceFields } from "@/lib/pieceRequest";
import { readyDate } from "@/lib/pieceTimeline";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toStudio } from "@/lib/time";
import { findTodaysBooking } from "@/lib/todaysBooking";
import { verifyTurnstile } from "@/lib/turnstile";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  if (!form) return fail("invalid", 400);

  const fields = parsePieceFields((k) => form.get(k));
  const photo = form.get("photo");
  if (!fields || !isAcceptablePhoto(photo)) return fail("invalid", 400);

  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0];
  if (!(await verifyTurnstile(fields.turnstileToken, ip))) return fail("turnstile", 403);

  const db = supabaseAdmin();
  const now = new Date();
  const { date } = toStudio(now);
  const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const photoPath = `${date.slice(0, 7)}/${crypto.randomUUID()}.${ext}`;

  const upload = await db.storage.from("pieces").upload(photoPath, photo, { contentType: photo.type });
  if (upload.error) {
    console.error("[pieces] photo upload failed", upload.error);
    return fail("upload", 502);
  }

  const booking = await findTodaysBooking(fields.phone, now).catch(() => null);
  const { data, error } = await db
    .from("pieces")
    .insert({
      name: fields.name,
      phone: fields.phone,
      email: fields.email,
      whatsapp_opt_in: fields.whatsappOptIn,
      policy_accepted_at: now.toISOString(),
      photo_path: photoPath,
      booking_id: booking?.id ?? null,
      checked_in_at: now.toISOString(),
    })
    .select("id, code, name, email, photo_path, checked_in_at, ready_at")
    .single();
  if (error || !data) {
    console.error("[pieces] insert failed (photo left at %s)", photoPath, error);
    return fail("generic", 500);
  }

  // "Recibimos tu pieza" email after the response is sent.
  after(() =>
    sendPieceMessage(data, "piece_received").catch((err) => console.error("[pieces] received email failed", err)),
  );

  return NextResponse.json(
    { piece: { code: data.code, readyDate: readyDate(new Date(data.checked_in_at)) } },
    { status: 201 },
  );
}
