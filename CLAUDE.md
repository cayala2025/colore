# Colore — Booking + Piece Tracking

Colore is a paint-your-own-pottery studio in Mexicali, Baja California (one location).
This app does two things:
1. **Bookings**: customers reserve seats in a 2-hour slot. No payment, no deposit.
2. **Piece tracking**: after painting, customers scan a QR, photograph their piece, and get notified when it is ready (14 days) and reminded until pickup. Unclaimed pieces are donated at day 45.

Full plan with tiny steps: `docs/SPRINTS.md` (read it at the start of every session; only [CC] steps are yours)
Progress log (append after every step): `docs/PROGRESS.md`
Open questions for the owner (never block on them): `docs/QUESTIONS.md`

## Stack (do not swap without asking)
- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- Supabase: Postgres, Auth (admin login only), Storage (piece photos)
- Resend for email, Vercel for hosting, Vercel Cron for scheduled jobs
- Cloudflare Turnstile on every public form
- Vitest for unit tests, Playwright for end-to-end tests
- npm (not pnpm/yarn)

## Commands
- `npm run dev`: local server at http://localhost:3000
- `npm run build`: must pass before any commit
- `npm run lint` and `npm run typecheck`: must pass before any commit
- `npm test`: Vitest unit tests
- `npm run test:e2e`: Playwright tests
- DB migrations live in `supabase/migrations/`. Apply with `npx supabase db push --db-url "$SUPABASE_DB_URL"`

## Business rules (source of truth)
### Schedule (timezone: America/Tijuana)
| Day | 11:00–13:00 | 16:00–18:00 | 18:00–20:00 | 20:00–22:00 |
|---|---|---|---|---|
| Mon | closed | closed | closed | closed |
| Tue–Wed | 30 | 30 | 30 | — |
| Thu–Sun | 30 | 30 | 30 | 30 |
- Capacity is 30 seats per slot. Seed these values in the DB; admin can edit them later.
- Admin can block full dates (holidays, private events).
- Customers can book up to 60 days ahead. Slots that already started cannot be booked.

### Bookings
- Party size 1–8 online. "9 o más" opens WhatsApp (`NEXT_PUBLIC_WHATSAPP_NUMBER`; it may be EMPTY during development: then the button still renders, links to `#`, and shows a dev-only warning. Never hardcode a number) with the prefilled text: "Hola, quiero reservar en Colore para un grupo de ___ personas".
- Fields: name, phone (WhatsApp), email, WhatsApp opt-in checkbox, privacy checkbox.
- A slot is available for a party if `capacity - sum(party_size of confirmed bookings) >= party_size`.
- Only ONE upcoming confirmed booking per phone number.
- Seats must never be oversold: create bookings through a single Postgres function (RPC) that locks the slot (`pg_advisory_xact_lock`) and re-checks capacity inside the transaction.
- Each booking gets a random `manage_token`. The link `/r/[token]` lets the customer confirm or cancel.
- Statuses: `confirmed`, `cancelled`, `attended`, `no_show`.

### Pieces
- QR on tables points to `/pieza`. Customer uploads a photo, then name/phone/email, opt-in, and accepts the pickup policy.
- The system assigns a short sequential code: `C-0001`, `C-0002`, ... Show it BIG on the success screen.
- If the phone matches a booking today, link `booking_id` and prefill fields.
- Timeline (days from check-in, studio timezone):
  - Day 0: "Recibimos tu pieza" (photo, code, ready date, 45-day donation policy)
  - Day 14: "Tu pieza está lista" (skip while `delayed = true`; send when staff marks ready)
  - Day 21 and Day 30: pickup reminders
  - Day 40: final notice "se donará en 5 días"
  - Day 45: status becomes `donated`, no message
- Statuses: `received`, `firing`, `ready`, `picked_up`, `donated`. `picked_up` and `donated` stop all messages.
- Compress photos in the browser before upload (max ~1600px long edge, JPEG ~0.8). Store in a PRIVATE bucket. Admin sees them via signed URLs.

### Notifications
- Every send is written to `notifications_log` first. Never send the same template twice to the same booking/piece (unique index on target + template).
- Booking emails: confirmation (instant), reminder (day before, with confirm/cancel link).
- Channel v1 = email via Resend. WhatsApp automation comes last (Sprint 7). Until then, the admin has "Enviar WhatsApp" buttons that open `https://wa.me/<phone>?text=<encoded message>`.
- One daily cron at 10:00 America/Tijuana (17:00 UTC; Vercel Cron uses UTC) handles booking reminders and the piece timeline. Jobs must be idempotent (safe to run twice).

## Code conventions
- All customer-facing text in Spanish (Mexico). Code, comments, and DB names in English.
- Put all UI copy in `src/content/es.ts`. No hardcoded strings in components.
- Dates: store `timestamptz` in UTC. Always convert with an explicit timezone helper in `src/lib/time.ts`. Never rely on the server timezone (Vercel runs in UTC).
- Phones: store in E.164. Default country +52, but allow +1 (many Mexicali customers have US numbers).
- Business logic (availability, timeline math) goes in pure functions in `src/lib/` with Vitest tests.
- Server-only code uses the Supabase service role key. It must never be imported into client components.
- Row Level Security ON for every table. Public users never write tables directly; they go through server routes/RPC that verify Turnstile first.
- Admin routes live under `/admin` and require Supabase Auth plus the email being in the `admins` table.
- Mobile-first. Customers will use phones for everything.

## Design
- Reference UX: https://reservas.artefacto.io/reservar/tampiquito. Copy the FLOW and the calm, minimal layout: step 1 people, step 2 calendar, step 3 time, then form. Do NOT copy their logo, text, photos, or brand name.
- Colore brand assets are pending. Use design tokens in `tailwind.config` / CSS variables (`--color-bg`, `--color-ink`, `--color-accent`, etc.) so the brand can be swapped in one place. Temporary palette: warm cream background, near-black text, one terracotta accent.
- Accessible: real buttons, visible focus, 44px minimum tap targets.

## How to work (autonomous mode)
- Work through `docs/SPRINTS.md` in order. Only do steps tagged **[CC]**. Skip **[YOU]** steps (they are for the human).
- After each step: run lint + typecheck + tests + build, fix until green, tick the checkbox in SPRINTS.md, append one line to `docs/PROGRESS.md`, then `git commit` with a clear message.
- If a step needs something only the human can provide (API key, account, brand asset, business decision): write it in `docs/QUESTIONS.md`, use a sensible placeholder or mock, and CONTINUE. Do not stop to ask.
- If an env var is missing, build the feature behind a mock (e.g. log emails to the console) and note it in QUESTIONS.md.
- Never: push to remote, deploy, delete data in Supabase, change the stack, commit `.env*` files, or print secrets.
- Keep changes small and commits frequent. If something fails 3 times the same way, write it in QUESTIONS.md and move to the next step.

## Environment variables (`.env.local`, never committed; keep `.env.example` updated)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits only, e.g. 5216860000000). Empty until Colore gets its phone; everything must work without it
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET` (Vercel sends it as a Bearer token to cron routes; reject requests without it)
