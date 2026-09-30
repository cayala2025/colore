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
