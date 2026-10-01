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
