# Connecting a card terminal to Cobro

Purpose: explain, in plain terms, whether and how a card machine can talk to `/cobro`, what each option costs in work, and what we would build. Nothing here is built yet. Hour figures are rough estimates, not quotes.

Research date: 2026-10-29. Provider details change often; confirm each point with the provider before committing.

## 1. The short answer

Yes, it is possible, but only with some terminals. There are three levels:

| Level | What it means | Effort |
|---|---|---|
| **A. Manual (works today)** | Staff charge on the terminal, then pick "Tarjeta" in Cobro. Two separate steps. | 0 h (already built) |
| **B. Semi-integrated** | Cobro sends the amount to the terminal. The customer pays on the terminal. The result comes back and the sale is saved automatically. | ~12–20 h per provider |
| **C. Fully custom / bank terminal** | Traditional bank terminals (BBVA, Santander, Banorte, etc.) usually have no public API. Not recommended. | Not practical |

For a studio with one counter and a few card sales per day, **level A plus a daily reconciliation check is enough for launch**. Level B is worth it only if staff mistakes (wrong amount, forgot to register) become a real problem.

## 2. Level A: what works today

1. Staff add the pieces in Cobro and choose **Tarjeta**.
2. They charge the same amount on the terminal.
3. At close, **Cortes → Día** shows the card total Cobro recorded.
4. Compare it with the terminal's own daily report (the "cierre de lote" or the provider app). They should match.

What can go wrong: the amount typed on the terminal differs from Cobro, or a sale is recorded in only one place. The daily comparison catches this. A planned addition to the Día cut is a field "Total de tarjeta según la terminal" with a green/red difference, the same way cash is checked. That is cheap (~2 h) and removes most of the risk.

The card fee is an editable number (Admin → Cortes → Ajustes, "Comisión de la terminal"). Use the real rate from your contract. The cut treats it as money the terminal keeps before depositing.

## 3. Level B: terminals that can be connected

### Mercado Pago Point (best documented option for Mexico)
- Mercado Pago publishes an **Orders API** for Point terminals. The flow: our server creates an order with the amount, the Point terminal loads the order, the customer pays on it, and the order status updates with the result.
- Supported readers per the Mexico docs: Point Smart 1 and 2. A Brazil page also lists Point Pro 2, so confirm the exact model for Mexico before buying.
- Notifications (webhooks) are configured in their "Your integrations" panel. Auth is OAuth over HTTPS.
- The older Point integration is being replaced, so build only on the Orders API.

### Clip
- Clip has developer credentials (API key and secret) in its dashboard under "Desarrolladores".
- A third-party Odoo connector exists, which suggests the PinPad API works with the readers Clip Total 3, Ultra, PinPad and Stand 2, with the Clip PinPad app installed and the PinPad API enabled on the reader.
- I could not find Clip's official endpoint documentation in this research. Ask Clip for it before choosing this path.

### Stripe Terminal
- Public preview in Mexico. Supported readers: Stripe Reader S710 (Wi-Fi only), BBPOS WisePad 3, and Tap to Pay on iPhone/Android.
- Pesos, Visa, Mastercard, American Express and Carnet. No meses sin intereses for in-person payments.
- Best developer experience, but it is a preview, the fees and payout terms differ from Mexican providers, and it needs a Stripe account verified for Mexico.

### Bank terminals (BBVA, Santander, Banorte, etc.)
Usually closed boxes with no way for software to send an amount. Keep them on level A.

## 4. What we would build for level B

The same shape works for any provider, so a first provider can be swapped later.

1. **New table `card_payments`** (additive): `id`, `provider`, `provider_order_id`, `amount_mxn`, `status` (`pending`, `approved`, `declined`, `cancelled`, `timeout`), `sale_id` (null until approved), `created_by`, timestamps, and the provider's last raw status text for troubleshooting. No card numbers are ever stored or seen; the terminal handles them.
2. **Cobro change:** with "Tarjeta" selected, the button becomes "Cobrar en terminal". The server creates the order and the screen shows "Esperando pago en la terminal…" with a **Cancelar** button.
3. **Webhook route** `/api/webhooks/<provider>`: public, so it must verify the provider's signature and be idempotent. When the payment is approved, it creates the sale through the existing `create_sale` function and links `card_payments.sale_id`.
4. **Edge cases:**
   - Declined or cancelled: no sale is created; staff can retry or switch to cash.
   - The customer paid but the connection dropped: the webhook still arrives and creates the sale; a "Pagos pendientes de revisar" list covers anything unmatched.
   - Closed day: the webhook cannot create a sale on a closed day, so it lands in the review list.
   - Refunds: voiding a card sale in Cobro does **not** return money. The refund is done on the provider's dashboard, and the void reason should say so. We would add a "reembolsado en terminal" tick on the void form.
5. **Secrets:** provider tokens go in `.env.local` and Vercel environment variables only. Never in code, Notion or logs.
6. **Fee check:** compare the real fee reported by the provider (if the API returns it) with the editable rate, and flag a mismatch.

Rough effort for the first provider: ~12–20 h (table + server calls + webhook + Cobro waiting screen + review list + tests against the provider's sandbox), plus ~2 h to buy and set up the terminal. Each extra provider after that: ~6–8 h.

## 5. Decisions needed from Carlos

1. Which terminal will the studio actually use, or is the choice still open? (A Mercado Pago Point is the lowest-risk pick for an integration.)
2. Is a daily "card total according to the terminal" check enough for launch? (Recommended.)
3. Does Colore need meses sin intereses? That affects which provider and how sales are recorded.
4. Who handles refunds, and is a refund from the provider dashboard acceptable?

## Sources
- [Mercado Pago Point: new Orders API (docs, MX)](https://www.mercadopago.com.mx/developers/en/docs/mp-point-legacy/overview)
- [Mercado Pago: Point + Orders API announcement, July 2025](https://www.mercadopago.com.mx/developers/en/news/2025/07/16/Transform-your-point-of-sale-with-the-new-integration-between-Point-and-the-Orders-API)
- [Clip PinPad connector for Odoo (shows API key and reader requirements)](https://apps.odoo.com/apps/modules/19.0/c_payment_clip_terminal)
- [Clip Pin Pad launch, Nov 2025](https://financialit.net/news/payments/clip-introduces-clip-pin-pad-its-first-fixed-terminal-for-counter-sales-and-self-service)
- [Stripe: Terminal in Mexico](https://support.stripe.com/questions/terminal-in-mexico)
