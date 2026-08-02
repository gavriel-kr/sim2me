# Ticket 033 — The transactional email a buyer actually needs (PRD)

Requested by Gabriel, 2026-08-02, after a full audit of every email the system can send.
Scope approved by him the same evening: **P0 + P1 only**. The lifecycle/marketing programme (P2)
is deliberately a separate ticket.

## The problem

Three findings from the audit, in order of what they cost.

**1. A customer can pay and hear nothing at all.** The purchase email is sent inside
`if (firstProfile)` in the Paddle webhook. If the eSIM profile never arrives, if provisioning
throws, or if the underpayment guard fires, the only email that goes out is an admin alert. The
person who was just charged gets silence. That is the shape of a chargeback.

**2. The one email a buyer does get is not a receipt.** It carries plan name, data, validity, QR and
activation details — and nothing else. No order number, no amount paid, no currency, no destination,
no date, no ICCID. Every one of those is already sitting on the `Order` row at the moment the email
is built; none of it is passed in. A customer with a question has no reference to quote and no proof
of what they bought.

**3. The buyer's language is thrown away.** The locale reaches the webhook through Paddle
`custom_data` and is used once, then discarded. It is not stored on the order. Every later send —
admin resend, customer retry, admin retry — therefore falls back to Hebrew, including for buyers who
never saw a word of it. The account link in the email has no locale prefix either, so a Hebrew buyer
who clicks it lands on the English site.

## What we are building

### Nobody who pays is left in silence

A new **order-delayed** email, localized in Hebrew, English and Arabic, sent to the customer whenever
fulfilment does not produce a profile — the `firstProfile` gap and the thrown-error path both. It
carries the order number, what was bought, a plain statement that the team is on it, and a way to
reach support. No technical wording, no error text.

Normal purchases stay at **one email**, not two. The eSIM is usually provisioned in ten to thirty
seconds, so a separate "payment received" note would arrive moments before the real thing and train
people to ignore us. The maximum a paying customer can hear nothing is that provisioning window.

**The underpayment path stays silent to the customer** — Gabriel's explicit call. Admin alerts there
are unchanged.

### The purchase email becomes a receipt as well as an install guide

Added: order number, destination, amount paid with currency, order date, ICCID, a direct link to the
order inside the account, and support links. The QR is **attached to the email** as well as embedded,
because Gmail and Outlook block remote images by default and today a customer who does not click
"show images" receives an email with no QR code in it at all.

### The buyer's language survives the transaction

`Order.locale` is persisted at webhook time and read by every later send, so a resend or a retry
speaks the language the customer bought in. The account link gains its locale prefix.

### Simi and Sima are in the inbox

The characters appear in every customer-facing email. This needs new artwork: all 42 assets in
`public/characters/` are AVIF and WebP, and **Outlook renders neither**. Email-specific PNGs are cut
from the existing masters.

### The supplier balance reaches the admin, and only the admin

The "New Order" admin email gains the live eSIM Access wallet balance with a low-balance threshold,
so a sale is also a fuel gauge. Gabriel was explicit: this figure must never appear in a customer
email under any circumstances.

### Delivery hygiene

`reply-to` on customer mail, a plain-text alternative beside every HTML body, and the contact form
stops sending to a hardcoded personal address — everything routes to `ADMIN_NOTIFICATION_EMAIL`,
`info.sim2me@gmail.com`.

## Out of scope

- **P2, the lifecycle programme** — abandoned cart to the customer, data-usage alerts, install
  reminders, review requests, win-back. Needs an unsubscribe mechanism and consent handling before a
  single message can legally go out. Its own ticket.
- **Login OTP stays disabled.** The template is tidied and given Arabic so it is ready; the mechanism
  in `src/lib/auth.ts` is not re-enabled.
- Email open/click logging and Resend webhooks — P3.
- Any change to auth, pricing, the charge path, or ticket 032's internal sale logic beyond passing
  the new email fields.

## A live production fault found during this work, outside the ticket

`sim2me.net` has **no Resend DNS records** — no DKIM at `resend._domainkey`, no `send.sim2me.net`,
and an SPF that points at Cloudflare rather than Amazon SES. Without them no Resend account can
verify the domain, so the site cannot send from `@sim2me.net` no matter which API key production
holds. A probe to a non-owner address returned `403 validation_error`.

This is a DNS and dashboard fix, not a code fix, and it is Gabriel's to make. It is recorded here
because **none of this ticket's work can be delivered to a customer until it is done.**

## Acceptance

- A successful purchase produces one customer email carrying QR, install details, order number,
  destination, amount, currency, date and ICCID, in the language of the checkout.
- A purchase whose profile never arrives produces a delayed-order email to the customer, in the same
  language, and the existing admin alert.
- An underpayment produces admin alerts only, exactly as today.
- An admin resend on an order bought in English arrives in English.
- The account link in an Arabic email opens the Arabic account page.
- Every customer email renders with the characters visible in Outlook, and with the QR available
  when remote images are blocked.
- The admin new-order email shows the wallet balance; no customer email mentions it.
- A failure inside the balance lookup does not affect the order or the customer email.
