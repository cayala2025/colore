# Open questions for the owner

- [Brand] Final logo, fonts and colors are pending. Using placeholder wordmark "Colore" and a cream/ink/terracotta palette (tokens in `src/app/globals.css`).
- [Copy] Tagline placeholder: "Pinta tu propia cerámica en Mexicali". Please confirm or send the real one.
- [WhatsApp] `NEXT_PUBLIC_WHATSAPP_NUMBER` is empty: "9 o más" and other WhatsApp links point to `#` and show a dev-only warning until the number is set.
- [UX] Slot chips show "N lugares" (seats left). Do you want customers to see the exact number of free seats, or only "Disponible" / "Lleno"?
- [DB URL — FYI, fixed] `SUPABASE_DB_URL` in `.env.local` had the password still wrapped in `[ ]` and a trailing `:`, and pointed to the direct host `db.<ref>.supabase.co`, which is IPv6-only (unreachable from this network). I replaced it with the IPv4 **session pooler** URL (`aws-0-us-west-1.pooler.supabase.com:5432`, user `postgres.<ref>`); the original is kept as a comment line. Use the pooler URL for prod too (Sprint 6).
- [Admin] When you add admin rows in Table Editor → `admins`, type the email in **lowercase** (the table enforces it).
