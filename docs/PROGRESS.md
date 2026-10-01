# Progress log

## Plan (session 1, 2026-09-30)
Goal: all [CC] steps of Sprints 1–5, in order.
Now: **Sprint 1 — Booking page look & feel (fake data)**. First 5 steps:
1. Scaffold Next.js (TS, Tailwind, App Router, src/, ESLint) in a temp folder, move in, merge .gitignore.
2. Scripts: typecheck, test (Vitest), test:e2e (Playwright) + .env.example.
3. Design tokens (CSS variables) + temporary palette.
4. `src/content/es.ts` with all booking copy.
5. Header: "Colore" wordmark placeholder + tagline.

## Log
- S1.1 ✅ Scaffolded Next.js 16 (TS, Tailwind v4, App Router, src/, ESLint); merged .gitignore; kept CLAUDE.md, added Next's AGENTS.md.
- S1.2 ✅ Scripts typecheck/test (Vitest)/test:e2e (Playwright, mobile Chromium, port 3100) + .env.example.
- S1.3 ✅ Design tokens as CSS variables in globals.css @theme (Tailwind v4 has no tailwind.config); cream/ink/terracotta palette; visible focus ring.
- S1.4 ✅ src/content/es.ts with all booking copy (steps, calendar, errors, success).
- S1.5 ✅ Header with placeholder "Colore" wordmark + tagline.
- S1.6 ✅ Step 1: party-size buttons 1–8 + "9 o más" inside a reusable StepCard.
- S1.7 ✅ "9 o más" → wa.me link with prefilled text via waLink() (tests); '#' + dev warning while number is empty.
- S1.8 ✅ Step 2: Monday-first month calendar (L M M J V S D) with pure grid helpers in src/lib/calendar.ts (tests); page renders per request with studio-tz today.
- S1.9 ✅ Calendar greys out Mondays, past days and days >60 ahead (src/lib/bookingWindow.ts + tests); month nav limited to bookable range.
- S1.10 ✅ Step 3: time slot chips from fake data (src/lib/fakeAvailability.ts, follows CLAUDE.md schedule).
- S1.11 ✅ Slots show "Lleno" (disabled) when seats left < party size; otherwise seats left.
- S1.12 ✅ Step 4 form: name, phone with +52/+1 selector, email, WhatsApp opt-in, privacy checkbox.
- S1.13 ✅ Client-side validation with Spanish errors (src/lib/validation.ts + src/lib/phone.ts E.164, tests); focuses first invalid field.
- S1.14 ✅ Success screen "¡Listo!" with date (Spanish long format, src/lib/format.ts + tests), time and people.
- S1.15 ✅ Steps 2–4 locked until the previous step is done; chosen values shown as summaries; next step scrolls into view; party change drops a slot that no longer fits.
- S1.16 ✅ Notes box "¿Niños menores de 14 o festejo? Escríbenos por WhatsApp" (WhatsApp link, placeholder while number is empty).
- S1.17 ✅ 375px check: fixed phone row overflow (select width) + truncated country label; e2e test asserts no element passes the right edge.
- S1.18 ✅ Playwright: 2 people → date → slot → form (validation) → success; step locking; 9 o más link.

### Sprint 1 done
- Works: booking page (header, 4 locked steps: party 1–8 + "9 o más" WhatsApp, Monday-first calendar with Mondays/past/>60 days greyed, slot chips with "Lleno", form with +52/+1 and Spanish validation, success screen, notes box). Mobile 375px verified. Unit tests 23 ✅, Playwright 4 ✅.
- Mocked: availability is fake (`src/lib/fakeAvailability.ts`); submit does not persist; WhatsApp number empty → links go to `#` with dev warning.
- Left: real data (Sprint 2); `/privacidad` page is linked but comes in Sprint 6.

## Sprint 2 — Booking goes real
- S2.1 ✅ Migration schedule_slots (ISO weekday, times, capacity, active; RLS on). Applied to dev DB via session pooler.
- S2.2 ✅ Seeded schedule as an idempotent migration (Tue–Wed 3 slots, Thu–Sun 4, 30 seats; Mon closed). Verified in dev DB.
- S2.3 ✅ Migration blocked_dates (date PK, reason; RLS on).
- S2.4 ✅ Migration bookings (status enum, E.164 check, starts_at UTC, random manage_token) + index (date, start_time) + partial index on confirmed phone; RLS on.
- S2.5 ✅ Migration admins (lowercase email PK; RLS on; authenticated users may read only their own row).
- S2.6 ✅ RLS on for every table (verified); revoked writes from anon/authenticated; event trigger auto-enables RLS on new public tables; `npm run test:db` integration tests prove anon can't read/write (8 ✅).
- S2.7 ✅ src/lib/time.ts: toStudio, todayInStudio, studioToUtc (DST-safe), studioDaysBetween + tests; unit tests run under TZ=Asia/Tokyo to catch server-tz reliance.
- S2.8 ✅ src/lib/availability.ts computeAvailability() + tests (Monday, blocked, full, 8 vs 7 seats, started slots, cancelled/no_show free seats, window).
- S2.9 ✅ GET /api/availability?month&party → days + slots (server-only service-role client; validates month and party 1–8). Verified against dev DB.
- S2.10 ✅ Calendar + slot chips use /api/availability (per month+party cache, loading/error/retry, keeps chosen date's slots while browsing months); removed fake data.
- S2.11 ✅ create_booking() RPC: per-slot pg_advisory_xact_lock, re-checks window/blocked/slot/started/capacity in-transaction; service_role only (revoked from anon). DB tests 14 ✅ (test rows cancelled, never deleted).
- S2.12 ✅ create_booking enforces one upcoming confirmed booking per phone (per-phone advisory lock, taken before slot lock) + E.164 check. DB tests 17 ✅.
- S2.13 ✅ POST /api/bookings: parse/validate body (shared validation) → verify Turnstile (fails closed; dev-only test secret if key missing) → E.164 → create_booking RPC; errors mapped to codes (tests). Verified live: 201, phoneHasBooking, invalid, turnstile.
- S2.14 ✅ Turnstile widget (explicit render, invisible unless needed; test site key fallback) on the form; submit posts to /api/bookings; token reset after failures. E2E uses CF test keys, random 555 phones, teardown cancels ZZ Test rows.
- S2.15 ✅ Friendly errors: slot full/started → clears slot, reloads availability, notice on step 3; blocked date → back to step 2; phone already booked / Turnstile / generic → form message. E2E for phone-twice and slot-filled-meanwhile (6 ✅).
- S2.16 ✅ DB test: 2 parallel bookings for the last seats → exactly one succeeds; burst of 12 never exceeds capacity (DB tests 19 ✅).

### Sprint 2 done
- Works: real schedule/blocked dates/bookings in Supabase (migrations 0100–0800 applied to dev); RLS on every table + no public writes + auto-RLS event trigger; DST-safe tz helpers; pure availability function; GET /api/availability; POST /api/bookings (Turnstile → E.164 → `create_booking` RPC with per-phone + per-slot advisory locks); friendly errors. Unit 46 ✅, DB integration (`npm run test:db`) 19 ✅, Playwright 6 ✅.
- Mocked: Playwright uses Cloudflare's always-pass Turnstile test keys.
- Notes: `SUPABASE_DB_URL` switched to the IPv4 session pooler (see QUESTIONS). Test rows ("ZZ Test", 555 phones) are cancelled, never deleted.
- Left: emails (Sprint 4), admin (Sprint 5).

## Sprint 3 — Piece check-in (QR)
- S3.1 ✅ Migration pieces (status enum, delayed flag, timestamps, optional booking_id) + piece_code_seq/next_piece_code() → C-0001… (no truncation past 9999); RLS on.
- S3.2 ✅ Migration notifications_log (booking_id|piece_id, template, channel, status pending/sent/failed) + unique (target, template) partial indexes; RLS on.
- S3.3 ✅ Private Storage bucket 'pieces' via migration (5 MB, images only, no policies); tests: private, anon can't upload/list, service role upload + signed URL.
- S3.4 ✅ /pieza step 1: big "Tomar foto" button (file input with capture=environment opens the rear camera); piece copy added to es.ts.
- S3.5 ✅ Browser compression: createImageBitmap (EXIF-aware) → canvas ≤1600px long edge → JPEG 0.8, <img> fallback; fitWithin() tested.
- S3.6 ✅ Photo preview with "Otra foto" (reopens camera) / "Usar esta"; e2e verifies compression to 1600×1067 and the buttons.
- S3.7 ✅ /pieza step 2 form (name, phone +52/+1, email, WhatsApp opt-in, pickup-policy checkbox explaining 14 days + donation at 45); booking form refactored into shared ContactForm.
- S3.8 ✅ /pieza prefills name/email when the phone has a booking today (POST /api/pieces/lookup: today only, rate limited 10/min/IP); booking_id is linked server-side on submit. Privacy trade-off logged in QUESTIONS.
- S3.9 ✅ POST /api/pieces (multipart): validate → Turnstile → upload photo to private bucket (YYYY-MM/uuid.jpg) → insert with today's booking_id → {code, readyDate}. E2E: check-in + booking link. Teardown marks ZZ Test pieces picked_up.
- S3.10 ✅ Piece success screen: huge mono code (C-0042), "Muéstrale este código al staff", ready date (+14 studio days), donation note; scrolls to top; fits 375px (e2e).
- S3.11 ✅ src/lib/pieceTimeline.ts pieceTimeline() → one message/day + markReady/donate; tests for every timeline day, delayed, early-ready, missed days, terminal statuses, full 60-day simulations (67 unit ✅).
- S3.12 ✅ `npm run qr` → print/pieza-qr.png + print/pieza-qr.pdf (letter table card: Colore, title, QR to NEXT_PUBLIC_SITE_URL/pieza, instructions, URL); warns if URL is localhost; print/ gitignored.

### Sprint 3 done
- Works: `pieces` (C-0001… codes), `notifications_log` (unique target+template), private `pieces` bucket; `/pieza` flow: camera button → in-browser compression (≤1600px JPEG 0.8) → preview Otra foto/Usar esta → contact form with pickup policy → POST /api/pieces (Turnstile, upload, insert, links today's booking) → huge code success screen; prefill from today's booking; pure `pieceTimeline()` with exhaustive tests; `npm run qr` (PNG + PDF card). Unit 67 ✅, DB 26 ✅, Playwright 9 ✅.
- Mocked: nothing new (emails come in Sprint 4; success text already promises one).
- Left: confirm timeline decisions + prefill privacy trade-off (QUESTIONS).

## Sprint 4 — Emails + daily cron
- S4.1 ✅ Installed resend + @react-email/components; shared Spanish email Layout (wordmark, card, footer with address placeholder) + render test.
- S4.2 ✅ Booking confirmation email (date, time, people, address, "Ver mi reservación" → /r/[token]) + tests.
- S4.3 ✅ Booking reminder email (day before) with Confirmar/Cancelar → /r/[token]?accion=… (links only preselect; never mutate on GET) + tests.
- S4.4 ✅ /r/[token]: shows booking + status; "Confirmar que voy" server action (only upcoming confirmed); GET never mutates; noindex; manageView() rules tested; e2e 3 ✅.
- S4.5 ✅ Cancel (with "¿Seguro?" step; email link preselects it) → status cancelled + cancelled_at; e2e proves seats freed in DB and in /api/availability.
- S4.6 ✅ Piece email templates (received: code, photo via signed URL, ready date, 45-day policy; ready / pickup reminder / final notice with last pickup date) + tests.
- S4.7 ✅ src/lib/notify.ts: insert notifications_log row first (unique target+template) → send → mark sent/failed; failed rows retried via atomic claim (max 3); DB tests: once-only, parallel, retry, recover (DB 30 ✅).
- S4.8 ✅ No RESEND_API_KEY → console sender (prints subject + plain text); Playwright forces this so tests never send real email; tests.
- S4.9 ✅ Booking confirmation + piece "received" emails sent via after() right after create (src/lib/messages.ts; photo as 60-day signed URL; lastPickupDate helper). E2E asserts notifications_log rows (13 ✅).
- S4.10 ✅ GET /api/cron/daily guarded by CRON_SECRET bearer (timing-safe, fails closed); unit + e2e tests.
- S4.11 ✅ Daily job part 1: reminders for tomorrow's confirmed bookings (studio date) via notify(); route runs parts independently; e2e: runs twice → one reminder.
- S4.12 ✅ Daily job part 2: piece timeline over active pieces (auto-ready at 14, ready/21/30/40 emails, donate at 45; retryable failures retried first; guarded status updates). E2E with 7 backdated pieces, run twice.
- S4.13 ✅ vercel.json cron /api/cron/daily at 0 17 * * * (test locks it in; winter = 09:00 local noted in QUESTIONS).
- S4.14 ✅ DB test: both daily jobs run twice → second run sends 0, no extra status changes; found+fixed 2 bugs: auto-ready now stamps scheduled ready time (no false delay shift) and max one piece message per studio day across runs (sentToday).

### Sprint 4 done
- Works: React Email templates in Spanish (booking confirmation/reminder; piece received/ready/reminder/final notice) on a shared layout; `/r/[token]` confirm + cancel (frees seats; GET never mutates); `notify()` logs first, sends once, retries failures (max 3) via atomic claim; console transport when RESEND_API_KEY is missing (always in tests); confirmation + received emails via `after()`; `/api/cron/daily` (CRON_SECRET) runs booking reminders + piece timeline, idempotent and max one piece message per day; `vercel.json` cron 17:00 UTC. Unit 88 ✅, DB 32 ✅, Playwright 17 ✅.
- Mocked: in tests, emails go to the console. Real Resend sending is wired but only verified by your [YOU] test (the Resend test sender can only email your Resend account address).
- Bugs found by tests and fixed: late auto-ready was shifting the pickup clock; two job runs on one day could send two piece messages.
- Left: studio address (placeholder), cron winter time (QUESTIONS).

## Sprint 5 — Admin
- S5.1 ✅ /admin/login (email + password via Supabase Auth browser client; Spanish errors); SSR server client; getAdmin/requireAdmin (getUser + admins table); test-only bypass guarded by non-production AND E2E_ADMIN_BYPASS=1 (unit-tested).
- S5.2 ✅ src/proxy.ts (Next 16 'middleware'): /admin/* refreshes session, requires Supabase user (getUser) + own row in admins (RLS) else → /admin/login(?error=not_admin); panel layout re-checks requireAdmin(); nav + logout. E2E: redirect, forged cookie rejected, bypass needs cookie.
- S5.3 ✅ /admin "Hoy": day navigation (?fecha), totals, per-slot used/free seats + bar, bookings list with status; blocked/closed notices; groupBookingsBySlot() tested (incl. off-schedule bookings).
- S5.4 ✅ Per-booking Llegó / No vino / Cancelar (with confirm) + Deshacer; server action re-checks admin, validates transitions (cancelled can't be revived), compare-and-set update. Unit + e2e.
- S5.5 ✅ "Enviar WhatsApp" per confirmed booking → wa.me/<customer E.164 digits> with prefilled reminder + manage link (message builders tested; +52 and +1).
