# Colore — Sprints (tiny steps)

**[YOU]** = Carlos does it by hand. Each one says **which app** and **how**.
**[CC]** = Claude Code does it. You don't do these: you just start Claude Code (see "Running Claude Code" at the bottom) and it works through them.

Rule for Claude Code: finish a step → lint + typecheck + test + build green → tick the box → one line in `docs/PROGRESS.md` → commit.

---

## Words used in this file

- **Terminal**: the Mac app for typing commands. Open it: press `Cmd + Space`, type `Terminal`, press Enter. To run a command, paste it and press Enter.
- **VS Code**: a free code editor. We use it to create and edit files (it shows hidden files like `.env.local`, which Finder hides). Download at code.visualstudio.com.
- **Project folder (repo root)**: the `colore` folder on your Mac, at `~/Documents/colore` (Finder → Documents → colore). "Repo root" means directly inside that folder, not inside a subfolder.
- **"In the project folder" (Terminal)**: before running project commands, type `cd ~/Documents/colore` and press Enter. Now Terminal is "inside" the folder.
- **`.env.local`**: a private file in the project folder that holds your passwords/keys. It is never uploaded to GitHub.

---

## Sprint 0 — Setup (all [YOU], ~1–2 hours)

> WhatsApp Business is postponed until Colore has its phone. The build does not need it.

### A. Accounts (App: your web browser)

- [ ] [YOU] **GitHub account**. App: browser.
  1. Go to github.com → **Sign up** (skip if you already have one).
- [ ] [YOU] **Create the empty repo**. App: browser (github.com).
  1. Top-right **+** → **New repository**.
  2. Repository name: `colore`. Choose **Private**.
  3. Leave "Add a README", ".gitignore" and "license" all OFF (empty repo).
  4. Click **Create repository**. Leave the page open; you'll need its name later.
- [ ] [YOU] **Vercel account**. App: browser.
  1. Go to vercel.com → **Sign Up** → choose **Hobby** → **Continue with GitHub** → authorize.
- [ ] [YOU] **Supabase account + dev project**. App: browser.
  1. Go to supabase.com → **Start your project** → **Continue with GitHub**.
  2. Click **New project**. Name: `colore-dev`.
  3. Database password: click **Generate a password**, then copy it into your password manager / Notes. You need it later.
  4. Region: **West US (North California)** (closest to Mexicali). Click **Create new project**. Wait ~2 minutes.
- [ ] [YOU] **Copy Supabase keys** into a temporary note. App: browser (Supabase dashboard of `colore-dev`).
  1. Click the **Connect** button at the top of the project dashboard.
  2. Copy the **Project URL** (looks like `https://abcd.supabase.co`) → label it `SUPABASE_URL`.
  3. Copy the **connection string (URI)** (starts with `postgresql://`). Replace `[YOUR-PASSWORD]` inside it with the DB password from before → label it `SUPABASE_DB_URL`.
  4. Left sidebar → **Project Settings** (gear icon) → **API Keys**.
  5. Copy the public key (**anon** or **publishable**) → label it `ANON_KEY`.
  6. Copy the secret key (**service_role** or **secret**; click Reveal) → label it `SERVICE_ROLE_KEY`. Treat it like a password.
  7. Can't find something? Press `Cmd + K` in the dashboard and search for it.
- [ ] [YOU] **Resend account + API key**. App: browser.
  1. Go to resend.com → **Sign up** (use the email you want test emails to arrive at).
  2. Left menu → **API Keys** → **Create API Key** → name `colore-dev` → **Add**.
  3. Copy the key now (it is shown only once) → label it `RESEND_API_KEY`.
- [ ] [YOU] **Cloudflare Turnstile keys** (the invisible anti-bot check). App: browser.
  1. Go to dash.cloudflare.com → sign up / log in.
  2. Find **Turnstile** in the left sidebar (or search "Turnstile" in the dashboard search).
  3. **Add widget** → name `colore` → hostname: `localhost` → mode: **Managed** → **Create**.
  4. Copy **Site Key** and **Secret Key** → label them `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.

### B. Your Mac (App: Terminal, unless it says otherwise)

- [ ] [YOU] **Install Homebrew** (the Mac installer for developer tools). App: Terminal.
  1. Paste: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` → Enter. Type your Mac password when asked (nothing shows while typing; that's normal).
  2. At the end it prints **"Next steps"** with 2–3 commands. Copy-paste and run those too.
  3. Check: `brew --version` prints a version.
- [ ] [YOU] **Install Node.js and GitHub CLI**. App: Terminal.
  1. Paste: `brew install node gh` → Enter. Wait.
  2. Check: `node -v` and `git --version` and `gh --version` each print a version.
- [ ] [YOU] **Log GitHub into your Mac**. App: Terminal (+ browser).
  1. Paste: `gh auth login` → Enter.
  2. Choose: **GitHub.com** → **HTTPS** → **Yes** (authenticate Git) → **Login with a web browser**.
  3. Copy the 8-character code it shows, press Enter, paste the code in the browser page, authorize.
- [ ] [YOU] **Install Claude Code**. App: Terminal.
  1. Paste: `curl -fsSL https://claude.ai/install.sh | bash` → Enter.
  2. **Close Terminal and open a new window** (so it sees the new command).
  3. Check: `claude --version` prints a version.
  4. Run `claude` once, follow the browser login with your Claude account, then type `/exit`.
- [ ] [YOU] **Install VS Code**. App: browser.
  1. code.visualstudio.com → Download for Mac → open the .zip → drag **Visual Studio Code** into **Applications**.
- [ ] [YOU] **Download the repo to your Mac**. App: Terminal.
  1. Paste: `cd ~/Documents` → Enter.
  2. Paste: `gh repo clone YOUR-GITHUB-USERNAME/colore` (replace with your username) → Enter.
  3. It may warn "you appear to have cloned an empty repository". That's expected.
  4. You now have `~/Documents/colore` (the project folder).

### C. Put the hand-off files in the project (App: VS Code)

- [ ] [YOU] **Open the project in VS Code**.
  1. Open VS Code → **File** → **Open Folder…** → Documents → `colore` → **Open**. Click "Yes, I trust the authors" if asked.
  2. The left sidebar (Explorer) now shows the project folder. The top level of that list is the **repo root**.
- [ ] [YOU] **Add `CLAUDE.md` to the repo root**.
  1. Drag the `CLAUDE.md` file from Finder (Downloads) onto the empty area of VS Code's left sidebar. Make sure it lands at the top level, not inside a folder.
- [ ] [YOU] **Add the `docs` folder and files**.
  1. In the VS Code sidebar, hover the project name → click the **New Folder** icon → type `docs` → Enter.
  2. Drag this `SPRINTS.md` file from Finder onto the `docs` folder.
  3. Right-click `docs` → **New File…** → `PROGRESS.md` → Enter. Do it again for `QUESTIONS.md`. Leave both empty.
- [ ] [YOU] **Create `.gitignore`** (stops your secrets from being uploaded to GitHub). **Do this before the first commit.**
  1. In the sidebar, hover the project name (top level) → **New File** icon → name it `.gitignore` → Enter.
  2. Paste these lines and save (`Cmd + S`):
     ```
     .env*
     !.env.example
     node_modules/
     .next/
     .DS_Store
     ```
- [ ] [YOU] **Create `.env.local`** in the repo root.
  1. Top level → **New File** icon → name it `.env.local` → Enter.
  2. Generate a cron secret: in Terminal paste `openssl rand -hex 32` → copy the long result.
  3. Paste this into `.env.local`, replace each value with what you saved above, then save (`Cmd + S`):
     ```
     NEXT_PUBLIC_SUPABASE_URL=paste SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY=paste ANON_KEY
     SUPABASE_SERVICE_ROLE_KEY=paste SERVICE_ROLE_KEY
     SUPABASE_DB_URL=paste SUPABASE_DB_URL
     RESEND_API_KEY=paste RESEND_API_KEY
     EMAIL_FROM=onboarding@resend.dev
     NEXT_PUBLIC_TURNSTILE_SITE_KEY=paste TURNSTILE_SITE_KEY
     TURNSTILE_SECRET_KEY=paste TURNSTILE_SECRET_KEY
     NEXT_PUBLIC_WHATSAPP_NUMBER=
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     CRON_SECRET=paste the openssl result
     ```
  4. No quotes, no spaces around `=`. Leave `NEXT_PUBLIC_WHATSAPP_NUMBER=` empty for now.
- [ ] [YOU] **First commit + upload to GitHub**. App: Terminal.
  1. `cd ~/Documents/colore` → Enter.
  2. `git add .` → Enter.
  3. `git status` → check `.env.local` is **NOT** in the list. If it is, stop and fix `.gitignore`.
  4. `git commit -m "Add project docs"` → Enter.
  5. `git push -u origin HEAD` → Enter.
  6. Refresh the GitHub repo page in the browser: you should see `CLAUDE.md`, `docs/`, `.gitignore` (and no `.env.local`).

✅ Sprint 0 done → go to "Running Claude Code" at the bottom and start it.

---

## Sprint 1 — Booking page look & feel (fake data)
- [x] [CC] Create the Next.js app (TypeScript, Tailwind, App Router, `src/` dir, ESLint). The folder already has files (`CLAUDE.md`, `docs/`, `.gitignore`, `.env.local`): scaffold in a temporary folder and move the app files in, keeping the existing files. Merge `.gitignore` entries.
- [x] [CC] Add scripts: `typecheck`, `test` (Vitest), `test:e2e` (Playwright). Add `.env.example` (names only, no values).
- [x] [CC] Add design tokens (CSS variables) and the temporary palette.
- [x] [CC] Create `src/content/es.ts` with all booking copy in Spanish.
- [x] [CC] Build the header: "Colore" wordmark placeholder + short tagline.
- [x] [CC] Step 1 component: buttons 1–8 + "9 o más".
- [x] [CC] "9 o más" opens the WhatsApp link with prefilled text (placeholder while the number is empty).
- [x] [CC] Step 2 component: month calendar, Monday first (L M M J V S D).
- [x] [CC] Calendar greys out Mondays, past days, and days > 60 days away.
- [x] [CC] Step 3 component: time slot chips for the chosen day (fake data).
- [x] [CC] Show "Lleno" on slots that don't fit the party size (fake data).
- [x] [CC] Step 4: form (name, phone with +52/+1 selector, email, 2 checkboxes).
- [x] [CC] Client-side validation with Spanish error messages.
- [x] [CC] Success screen: "¡Listo!" with date, time, people.
- [x] [CC] Steps stay locked until the previous one is done (like Artefacto).
- [x] [CC] Notes box: "¿Niños menores de 14 o festejo? Escríbenos por WhatsApp".
- [x] [CC] Check it on a 375px-wide screen. Fix anything that overflows.
- [x] [CC] Playwright test: pick 2 people → a date → a slot → fill form → see success.
- [ ] [YOU] **See it on your phone**. App: Terminal + phone browser.
  1. Terminal: `cd ~/Documents/colore` → `npm run dev` → Enter. Leave this window open (closing it stops the site).
  2. It prints two addresses. **Local** (`http://localhost:3000`) works on the Mac. **Network** (like `http://192.168.1.23:3000`) works on your phone.
  3. On your phone (same Wi-Fi as the Mac), open Safari/Chrome and type the **Network** address.
  4. Show her. Write her comments in `docs/QUESTIONS.md` (VS Code).
  5. To stop the site: click the Terminal window and press `Ctrl + C`.

## Sprint 2 — Booking goes real
- [x] [CC] Migration: `schedule_slots` (weekday, start_time, end_time, capacity, active).
- [x] [CC] Seed the schedule from CLAUDE.md.
- [x] [CC] Migration: `blocked_dates` (date, reason).
- [x] [CC] Migration: `bookings` (see CLAUDE.md) + index on (date, start_time).
- [x] [CC] Migration: `admins` (email).
- [x] [CC] Turn on RLS for every table. No public insert/update policies.
- [x] [CC] `src/lib/time.ts`: timezone helpers for America/Tijuana + tests.
- [x] [CC] `src/lib/availability.ts`: pure function (schedule, blocks, bookings, party size) → available slots. Tests for: Monday, blocked day, full slot, 8 people when 7 seats left, slot already started.
- [x] [CC] API route `GET /api/availability?month=YYYY-MM&party=N` → days + slots.
- [x] [CC] Hook the calendar and slot chips to the real API.
- [x] [CC] Postgres function `create_booking(...)` with advisory lock + capacity re-check.
- [x] [CC] Enforce one upcoming booking per phone inside that function.
- [x] [CC] API route `POST /api/bookings`: verify Turnstile → normalize phone → call RPC.
- [x] [CC] Add the Turnstile widget to the form (use Cloudflare's test keys if real ones are missing).
- [x] [CC] Friendly errors: slot just filled, phone already has a booking.
- [x] [CC] Test: 2 parallel bookings for the last seats → exactly one succeeds.
- [ ] [YOU] **Make 3 test bookings and see them in the database**. App: browser.
  1. Start the site (Terminal: `cd ~/Documents/colore` → `npm run dev`), open `http://localhost:3000`.
  2. Make 3 bookings with different phone numbers.
  3. Supabase dashboard (`colore-dev`) → left sidebar **Table Editor** → click `bookings`. You should see 3 rows.

## Sprint 3 — Piece check-in (QR)
- [x] [CC] Migration: `pieces` (see CLAUDE.md) + sequence for codes.
- [x] [CC] Migration: `notifications_log` + unique index (target, template).
- [x] [CC] Private Storage bucket `pieces`.
- [x] [CC] Page `/pieza`, step 1: big "Tomar foto" button (opens the phone camera).
- [x] [CC] Compress the photo in the browser before upload.
- [x] [CC] Show a preview with "Otra foto" / "Usar esta".
- [x] [CC] Step 2: name, phone, email, opt-in, "acepto la política de recolección" (explains 14 days + donation at 45).
- [x] [CC] If the phone has a booking today, prefill name/email and link `booking_id`.
- [x] [CC] API route `POST /api/pieces`: verify Turnstile → upload photo → insert → return code.
- [x] [CC] Success screen: HUGE code (e.g. C-0042), ready date, "muéstrale este código al staff".
- [x] [CC] `src/lib/pieceTimeline.ts`: pure function (checked_in_at, today, status, delayed) → which message is due. Tests for every day in the timeline.
- [x] [CC] Script `npm run qr` → generates a printable PNG/PDF QR pointing to `NEXT_PUBLIC_SITE_URL/pieza`, saved in `print/`.
- [ ] [YOU] **Check in a real piece from your phone**. App: Terminal + phone.
  1. Terminal: `cd ~/Documents/colore` → `npm run dev`. Note the **Network** address.
  2. On your phone, open `<Network address>/pieza` (e.g. `http://192.168.1.23:3000/pieza`). (The printed QR will point to the real domain after launch; for now type the address.)
  3. Take a photo of any mug, fill the form, submit.
  4. You get a code like C-0001. Write it on a sticky note on the mug.
  5. Supabase → **Storage** → `pieces` bucket: the photo is there. **Table Editor** → `pieces`: the row is there.

## Sprint 4 — Emails + daily cron
- [x] [CC] Install Resend + React Email. Shared email layout in Spanish.
- [x] [CC] Template: booking confirmation (date, time, people, address, manage link).
- [x] [CC] Template: booking reminder (day before, "Confirmar" / "Cancelar").
- [x] [CC] Page `/r/[token]`: shows the booking, confirm and cancel buttons.
- [x] [CC] Cancel frees the seats (status → cancelled).
- [x] [CC] Templates: piece received, piece ready, pickup reminder, final notice.
- [x] [CC] `src/lib/notify.ts`: write to `notifications_log` first, then send; skip if already sent.
- [x] [CC] If `RESEND_API_KEY` is missing, log emails to the console instead.
- [x] [CC] Send confirmation email right after booking; "received" email right after check-in.
- [x] [CC] Route `GET /api/cron/daily` protected by `CRON_SECRET`.
- [x] [CC] Daily job part 1: reminders for tomorrow's bookings.
- [x] [CC] Daily job part 2: piece timeline (ready / 21 / 30 / 40 / mark donated at 45).
- [x] [CC] `vercel.json` cron: once a day at 17:00 UTC.
- [x] [CC] Test: running the job twice sends nothing twice.
- [ ] [YOU] **Test the emails**. App: browser + Terminal + your email inbox.
  1. Start the site (`cd ~/Documents/colore` → `npm run dev`).
  2. Book a slot for **tomorrow** using the **same email you signed up to Resend with** (the test sender can only email that address).
  3. Check your inbox (and spam) for the confirmation.
  4. Open a **second** Terminal window (`Cmd + N`) and run the daily job by hand (replace YOUR_SECRET with `CRON_SECRET` from `.env.local`):
     `curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/cron/daily`
  5. You should get the reminder email. Run the same command again: you should NOT get a second one.
  6. Click "Cancelar" in the email → the booking disappears from the calendar.

## Sprint 5 — Admin
- [ ] [YOU] **Create her admin login**. App: browser (Supabase dashboard of `colore-dev`).
  1. Left sidebar → **Authentication** → **Users** → **Add user** → **Create new user**.
  2. Enter her email + a password. Tick **Auto Confirm User**. Click **Create user**.
  3. Left sidebar → **Table Editor** → `admins` → **Insert** → **Insert row** → type her email → **Save**.
  4. Do the same for your own email so you can log in too.
- [x] [CC] `/admin/login` (email + password via Supabase Auth).
- [x] [CC] Middleware: `/admin/*` requires login + admin email.
- [x] [CC] `/admin` home "Hoy": today's slots, seats used/free, list of bookings.
- [x] [CC] Buttons per booking: Llegó (attended), No vino (no_show), Cancelar.
- [x] [CC] "Enviar WhatsApp" button per booking (wa.me link to the customer's number with prefilled reminder).
- [x] [CC] `/admin/calendario`: week view with bookings per slot.
- [x] [CC] `/admin/horario`: edit slot times/capacity, turn slots on/off.
- [x] [CC] `/admin/bloqueos`: add/remove blocked dates.
- [x] [CC] `/admin/piezas`: board with columns Recibida / En horno / Lista / Recogida.
- [x] [CC] Search pieces by code, name, or phone (for pickup at the counter).
- [x] [CC] Buttons per piece: marcar en horno, marcar lista, retrasada, entregada.
- [x] [CC] Bulk select → "marcar lista" (for a whole kiln load).
- [x] [CC] "Por donar" list: pieces at day 45.
- [x] [CC] "Enviar WhatsApp" button per piece (ready / reminder text).
- [ ] [CC] Show a no-show badge next to phones with past no-shows.
- [ ] [YOU] **Usability test with her**. App: browser on the Mac or a tablet.
  1. Start the site (`npm run dev`), open `http://localhost:3000/admin` (on a tablet: the Network address + `/admin`).
  2. Let her log in and do: find today's bookings, mark one as arrived, mark a piece ready, find a piece by code.
  3. Don't help. Write every moment she hesitates in `docs/QUESTIONS.md` (VS Code). Claude Code will fix them next session.

## Sprint 6 — Launch

### A. WhatsApp number (once Colore has its phone; required before launch)
- [ ] [YOU] **Set up WhatsApp Business**. App: the new phone.
  1. Put the SIM in. Install **WhatsApp Business** (App Store / Play Store). It is a different app from regular WhatsApp.
  2. Register the new number. Business profile: name "Colore", logo, category (Arts & Crafts / Art studio), hours, address, Instagram link.
- [ ] [YOU] **Tell the website the number**. App: VS Code (and later Vercel).
  1. In `.env.local`, set `NEXT_PUBLIC_WHATSAPP_NUMBER=52` + 10-digit number, digits only (e.g. `526861234567`). Save.
  2. Restart the site (Terminal: `Ctrl + C`, then `npm run dev`). Tap "9 o más": it should open a chat with Colore.
  3. After the Vercel step below, add the same variable in Vercel too.
- [ ] [YOU] **Use Colore's WhatsApp on the admin computer**. App: the new phone + browser.
  1. Phone: WhatsApp Business → **Settings** → **Linked devices** → **Link a device**.
  2. Computer: open web.whatsapp.com and scan the QR with the phone.
  3. Now the admin "Enviar WhatsApp" buttons send from Colore's number.

### B. Go live
- [ ] [YOU] **Buy the domain**. App: browser.
  1. Buy e.g. `colore.mx` at a registrar that sells .mx (Akky.mx, GoDaddy, etc.). Keep the login; you'll add DNS records there.
- [ ] [YOU] **Create the production database**. App: browser + Terminal.
  1. Supabase → **New project** → `colore-prod`, same region, generate + save a new DB password.
  2. Copy its keys the same way as Sprint 0 (Connect button + Project Settings → API Keys). Keep them in a separate note labeled PROD.
  3. Terminal: `cd ~/Documents/colore` → `npx supabase db push --db-url "PASTE_PROD_DB_URL"` → Enter. This creates all tables in prod.
  4. Redo the "Create her admin login" steps from Sprint 5 in `colore-prod`.
- [ ] [YOU] **Put the site on Vercel**. App: browser (vercel.com).
  1. **Add New…** → **Project** → find `colore` → **Import**.
  2. Open **Environment Variables**. Paste the whole `.env.local` content into the first "Key" box (Vercel splits it into rows), then replace every value with the **PROD** values. Set `NEXT_PUBLIC_SITE_URL=https://colore.mx` (your domain) and `EMAIL_FROM` as in the Resend step below.
  3. Click **Deploy**. Wait ~2 min. Open the `.vercel.app` link it gives you.
- [ ] [YOU] **Connect your domain**. App: Vercel + your registrar.
  1. Vercel → your project → **Settings** → **Domains** → **Add** → type `colore.mx` → Add.
  2. Vercel shows DNS records (type, name, value). Copy them into your registrar's **DNS** settings page.
  3. Wait until Vercel shows **Valid Configuration** (minutes to a few hours).
- [ ] [YOU] **Send email from your domain**. App: Resend + your registrar + Vercel.
  1. Resend → **Domains** → **Add Domain** → `colore.mx`.
  2. Copy the DNS records it shows into your registrar's DNS page. Back in Resend click **Verify**.
  3. Vercel → project → **Settings** → **Environment Variables** → set `EMAIL_FROM=Colore <reservas@colore.mx>`.
  4. Vercel → **Deployments** → on the latest one click **⋯** → **Redeploy** (env changes need a redeploy).
- [ ] [YOU] **Allow your domain in Turnstile**. App: Cloudflare dashboard.
  1. Turnstile → your `colore` widget → **Settings** → Hostnames → add `colore.mx` → Save.
- [ ] [CC] Page `/privacidad` (aviso de privacidad draft; flag it for legal review).
- [ ] [CC] Page `/politicas` (cancellations, kids, pieces 14 days / donation 45 days).
- [ ] [CC] Favicon, page title, share image (placeholders until brand assets arrive).
- [ ] [YOU] **Upgrade to paid plans** (the free plans don't allow a live business / pause when idle). App: browser.
  1. Vercel → your team/account **Settings** → **Billing** → upgrade to **Pro**.
  2. Supabase → your organization → **Billing** → upgrade to **Pro**.
- [ ] [YOU] **Print the table QR codes**. App: Terminal + printer.
  1. Make sure `.env.local` has `NEXT_PUBLIC_SITE_URL=https://colore.mx`.
  2. Terminal: `cd ~/Documents/colore` → `npm run qr`. Open the `print` folder in Finder, print the file.
  3. Scan one with your phone before printing 20: it must open `colore.mx/pieza`.
- [ ] [YOU] **Friends test**. App: everyone's phones.
  1. 5 friends book on `colore.mx`, one cancels from the email link.
  2. They scan a table QR and check in a piece.
  3. She runs the day from `/admin`. Write down anything odd in `docs/QUESTIONS.md`.
- [ ] [YOU] **Go public**. App: Instagram.
  1. Instagram → **Edit profile** → **Links** → **Add external link** → `https://colore.mx` → Save.

## Sprint 7 — Automatic WhatsApp (after launch)
> Meta's screens change often. When you get here, ask me for a fresh walkthrough of these screens before starting.
- [ ] [YOU] **Create a Meta Business portfolio**. App: browser (business.facebook.com). Create account → business name "Colore", your details.
- [ ] [YOU] **Start business verification**. App: browser. In the portfolio → **Security Center** → **Start verification**. Upload business documents. Wait for approval (can take days).
- [ ] [YOU] **Connect the WhatsApp number to the API**. App: browser (developers.facebook.com → create an app → add the WhatsApp product). Try "connect an existing WhatsApp Business app number" (coexistence). If it's not eligible, get a 2nd number used only for automatic notices.
- [ ] [YOU] **Create a permanent access token**. App: browser (Business Settings → **Users** → **System users** → Add → **Generate token** with WhatsApp permissions). Put `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` (from the app's WhatsApp → API Setup page) in `.env.local` and Vercel.
- [ ] [CC] Write the 6 utility templates in Spanish (reminder, received, ready, pickup reminder, final notice, booking confirmation) in `docs/whatsapp-templates.md`.
- [ ] [YOU] **Submit the templates**. App: browser (WhatsApp Manager → **Message templates** → **Create template** → Category **Utility** → Language **Spanish (MEX)**). Paste each one from `docs/whatsapp-templates.md`. Wait for approval.
- [ ] [CC] `src/lib/whatsapp.ts`: send a template via the Cloud API.
- [ ] [CC] `notify.ts`: send WhatsApp if opt-in, email always.
- [ ] [CC] Webhook route for delivery status → update `notifications_log`.
- [ ] [YOU] **Test**. App: your phone. Trigger each message to your own number once; check the text and links.

---

## Running Claude Code (how to start a work session)

**App: Terminal.**

1. Open Terminal → `cd ~/Documents/colore` → Enter.
2. Start Claude Code in auto mode, with the Mac kept awake:
   `caffeinate -i claude --permission-mode auto` → Enter.
   (`caffeinate` stops the Mac from sleeping. Keep the laptop plugged in and the lid open.)
3. Type `/context` → Enter. Under **Memory files** you should see `CLAUDE.md`. If not, you're in the wrong folder.
4. Paste the kickoff prompt below → Enter. Walk away.
5. When you come back: read the end of `docs/PROGRESS.md` and `docs/QUESTIONS.md` in VS Code.
6. If it stopped early, start a new session (steps 1–2) and type:
   `Continue from docs/PROGRESS.md. Same rules as before.`
7. To exit Claude Code: type `/exit`.
8. To upload its work to GitHub (it never pushes by itself): in Terminal, `git push`.

### Kickoff prompt (copy all of it)

```
You are building the Colore booking + piece tracking system. Read CLAUDE.md and docs/SPRINTS.md fully before writing any code.

GOAL FOR THIS SESSION: complete every [CC] step in Sprints 1, 2, 3, 4 and 5, in order.

HOW TO WORK:
1. Before starting, write a short plan in docs/PROGRESS.md: which sprint you're on and your first 5 steps.
2. Do ONE step at a time. After each step: run lint, typecheck, tests and build. Fix until all are green. Tick the checkbox in docs/SPRINTS.md. Add one line to docs/PROGRESS.md. Commit.
3. Skip [YOU] steps. Never wait for me.
4. If you need something only I can give (a key, an account, a brand asset, a business decision): write it in docs/QUESTIONS.md, use a mock or placeholder, and keep going.
5. If the same error happens 3 times, write it in docs/QUESTIONS.md and move to the next step.
6. At the end of each sprint: run the full Playwright suite and write a "Sprint N done" summary in PROGRESS.md (what works, what's mocked, what's left).
7. Never push, deploy, delete Supabase data, commit .env files, or change the stack.

DEFINITION OF DONE: all [CC] boxes in Sprints 1–5 are ticked, everything is green, and PROGRESS.md ends with a final summary plus the list of open items from QUESTIONS.md.

Start now with Sprint 1, step 1.
```
