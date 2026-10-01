# Open questions for the owner

- [Brand] Final logo, fonts and colors are pending. Using placeholder wordmark "Colore" and a cream/ink/terracotta palette (tokens in `src/app/globals.css`).
ANSWER: I added the logo to the colore main folder it is available as a .jpg file. ColoreLogo.JPG
- [Copy] Tagline placeholder: "Pinta tu propia cerámica en Mexicali". Please confirm or send the real one.
ANSWER: tagline is: "El Arte esta en Todas Partes"
- [WhatsApp] `NEXT_PUBLIC_WHATSAPP_NUMBER` is empty: "9 o más" and other WhatsApp links point to `#` and show a dev-only warning until the number is set.
ANSWER: Lets keep it open for now.
- [UX] Slot chips show "N lugares" (seats left). Do you want customers to see the exact number of free seats, or only "Disponible" / "Lleno"?
ANSWER: only disponible or no disponible. i don't want them to be seats available
- [DB URL — FYI, fixed] `SUPABASE_DB_URL` in `.env.local` had the password still wrapped in `[ ]` and a trailing `:`, and pointed to the direct host `db.<ref>.supabase.co`, which is IPv6-only (unreachable from this network). I replaced it with the IPv4 **session pooler** URL (`aws-0-us-west-1.pooler.supabase.com:5432`, user `postgres.<ref>`); the original is kept as a comment line. Use the pooler URL for prod too (Sprint 6).
ANSWER: ok approved
- [Admin] When you add admin rows in Table Editor → `admins`, type the email in **lowercase** (the table enforces it).
- [Testing] Automated tests write real rows to the **dev** DB with name "ZZ Test" and phones starting with 555. They are cancelled (never deleted) after each run. You can filter them out in Table Editor, or delete them yourself if you want a clean table.
- [Turnstile] Playwright runs with Cloudflare's always-pass test keys. Your real keys (hostname `localhost`) are used by `npm run dev`. Remember to add the production domain to the widget (Sprint 6).
- [Storage] DB tests upload tiny 1×1 test images to `pieces/test/` in the dev bucket (never deleted automatically). Safe to delete by hand.
- [Privacy — decision needed] `/pieza` prefills name + email when the typed phone has a booking **today**. That means anyone who knows/guesses a phone of today's customer could see their name and email. Mitigations in place: today's bookings only, 10 lookups/min per IP. Safer alternative: don't prefill, just link the booking silently on submit (already done server-side too). Tell me if you prefer the safer option.
- [Pieces — decisions I made, please confirm] (1) If the daily job misses days, only the latest reminder is sent (no bursts). (2) A delayed piece's pickup clock starts when it becomes ready, so the customer always gets 31 days between "lista" and donation (instead of donating at day 45 from check-in). (3) A piece is never donated before the "se donará en 5 días" notice was sent. (4) At day 14, if not delayed, the job moves the piece to "Lista" automatically.
- [Studio address] Emails show a placeholder address ("Dirección por confirmar, Mexicali, B.C."). Send the real address (and a Google Maps link) and I'll put it in `src/content/es.ts` → `studio`.
- [Testing — heads-up] `npm run test:e2e` runs the daily job against the **dev** DB with emails going to the console. Any dev booking for tomorrow gets its reminder logged as sent (console) during that run, so for your Sprint 4 email test, make the booking *after* running tests (or just don't run e2e in between).
- [Cron time] Vercel Cron uses UTC, so `0 17 * * *` is 10:00 in Mexicali during daylight time but **09:00 in winter** (Nov–Mar). Fine for reminders; tell me if it must be 10:00 all year (I'd run it at 17:00 and 18:00 UTC and skip the run that isn't 10:00 local).
- [Admin testing] I did not create any Supabase Auth users. Admin e2e tests use a test-only bypass (needs a non-production build + `E2E_ADMIN_BYPASS=1` + an `e2e_admin=1` cookie; impossible on Vercel). The real login is verified by your Sprint 5 "Create her admin login" step.
ANSWERS (Carlos):
- Admin / Testing / Turnstile / Storage / Admin testing: OK, understood.
- Privacy: use the SAFER option. Do NOT prefill name/email on /pieza. Keep the silent server-side booking link. Remove the lookup endpoint if nothing else uses it.
- Pieces (1) approved. (2) approved: 31 days from "lista" to donation for every piece. (3) approved.
- Pieces (4) REJECTED: never auto-move to "Lista". The "lista" message is sent only when staff marks it ready. Instead, at day 14+ if not ready, show the piece in a new admin list "Revisar: pasaron 14 días" (on /admin/piezas and as a count on /admin home). No customer message until staff marks it ready.
- Cron: keep 0 17 * * * (09:00 in winter is fine).
- Studio address: still pending, keep the placeholder. I'll send it later.
## Follow-ups (session 2)
- [Brand — FYI] Logo cropped into `public/brand/colore-logo.jpg` and used in the site header (on a band matching its pink) and emails; palette retuned to the logo (pink `#f5d5d6`, terracotta `#b04a38`). The logo spells **"Coloré"** (with accent). The site text says "Colore". Should the name be written "Coloré" everywhere?
- [Done — session 2] Applied your answers: logo + tagline + palette; slots show only Disponible / No disponible (seat counts no longer leave the server); /pieza prefill and lookup endpoint removed (silent booking link kept); pieces never auto-ready, "lista" only when staff marks it, 31 days from "lista" to donation, new "Revisar: pasaron 14 días" list + count on Hoy; cron unchanged. CLAUDE.md business rules updated to match.
- Still open: WhatsApp number (kept open), studio address (placeholder), "Colore" vs "Coloré" spelling (above).
