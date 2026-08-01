# PRD — Ticket 026: Support Readiness (Minimum Viable Support)

## Problem

Sim2Me is launching without a staffed support desk, but the site currently behaves as if one exists.

Three concrete gaps, all verified in code:

1. **The customer gets nothing back.** `POST /api/contact` saves the submission to `contact_submissions` and emails the admin, but sends **no auto-reply**. The customer's only feedback is the on-page success state in `ContactForm.tsx`. There is no reference number, no proof, no stated expectation. This is what produces duplicate "did you get my message?" submissions, angry follow-ups, and Paddle chargebacks from customers who believe they were ignored.

2. **The site promises more than we can deliver.** `trustSupport` reads `"תמיכה 24/7"` / `"24/7 support"` / `"دعم 24/7"` (`src/messages/{he,en,ar}.json:49`), rendered in `Hero.tsx:197` and `TrustStrip.tsx:26`. The contact page states `"אנחנו בדרך כלל עונים תוך מספר שעות"` (`contact.responseTime`). Neither is true today. Beyond the trust damage, an unkeepable published service promise is exposure under Israeli consumer protection law and weakens our position in a Paddle chargeback dispute.

3. **The admin notification is not actionable.** It is hardcoded to `gavriel.kr@gmail.com` (`src/app/api/contact/route.ts:54`), it **omits the phone number** even though the form requires it, and every submission looks identical — a refund request and a "do you have an app?" arrive with the same subject line and the same urgency.

Additionally, four different support addresses appear across the codebase (`info@sim2me.net` in `brand.ts`/`policies.ts`/footer, `support@sim2me.net` in seed + `AccountClient.tsx`, `gavriel.kr@gmail.com`, `info.sim2me@gmail.com`), so a customer can be told two different addresses on two different pages.

## What we already have (do not rebuild)

- `ContactSubmission` model with `status` (NEW / IN_PROGRESS / RESOLVED), `read`, and `ContactNote`.
- Full admin inbox at `/admin/contact` — filters, status workflow, internal notes, bulk update, Excel export.
- Help center (`/help`) with 15 localized FAQs, `/installation-guide`, `/compatible-devices`, `/refund`.
- Customer account: order list, QR display, live eSIM usage, and a Support tab showing their own submissions.
- Resend infrastructure in `src/lib/email.ts` with an established localized-copy pattern (`RESET_COPY`, `POST_PURCHASE_COPY`, `EmailLocale`, `toEmailLocale`).

The infrastructure is sound. This ticket closes the expectation gap around it.

## Goals

| # | Goal | Success measure |
|---|------|-----------------|
| G1 | Every submitter receives an immediate, localized auto-reply with a reference number | Auto-reply lands in he/en/ar with a `SM-XXXXXX` reference matching the admin record |
| G2 | The response promise is honest and identical everywhere it appears | One SLA string, used in trust strip, contact page, success screen, and auto-reply, in 3 locales |
| G3 | Gabriel can triage a submission from the notification email alone | Email contains name, email, **phone**, subject, message, reference, admin deep link; urgent subjects flagged in the subject line |
| G4 | One support address across the whole site | Single address in brand config, seed, account UI, and legal copy |
| G5 | The auto-reply deflects part of the volume | Auto-reply carries self-help links chosen by the selected subject |

## Non-goals (deliberately deferred)

- In-form deflection UI (showing fix steps when a subject is selected) — separate ticket.
- Guest order lookup / self-service QR resend — separate ticket.
- WhatsApp channel — deferred by decision; creates an instant-response expectation and bypasses the admin record.
- Replying to customers from inside `/admin/contact` — only worth building above ~20 submissions/week.
- AI first-line answering — later, once FAQ coverage is proven.
- Any schema change. The reference number is derived from the existing `cuid`.

## Copy decisions

> **Status 2026-07-31 — the SLA table below was rejected.** Gabriel cannot commit to any response-time promise at this stage, and also rejected the alternative "outcome guarantee" framing. The table is kept as the proposal of record; see `03-DIP.md` → "Copy — unresolved" for the current state and the unblocking path. Everything else in this PRD stands.

**SLA — 24 hours, with priority for travelers who are stuck.** Chosen over "a few hours" because it is keepable while operating solo, including overnight and weekends. Under-promising and hitting it beats a tighter promise we miss.

| Key | he | en | ar |
|---|---|---|---|
| `home.trustSupport` | תמיכה בעברית, מענה תוך 24 שעות | Human support, reply in 24h | دعم بشري، رد خلال 24 ساعة |
| `contact.responseTime` | אנחנו עונים תוך 24 שעות. פניות דחופות מחו"ל מטופלות בעדיפות. | We reply within 24 hours. Urgent issues while traveling get priority. | نرد خلال 24 ساعة. الحالات العاجلة أثناء السفر لها أولوية. |
| `contact.messageSentDesc` | קיבלנו את הפנייה. שלחנו לך מייל אישור עם מספר פנייה — נחזור אליך תוך 24 שעות. | We've got it. A confirmation email with your reference number is on its way — we'll reply within 24 hours. | استلمنا رسالتك. أرسلنا لك بريد تأكيد مع رقم مرجعي — سنرد خلال 24 ساعة. |

`trustSupport` is a short trust-strip chip; the Hebrew variant leans on "בעברית" because for the Israeli market native-language support is a stronger and fully truthful claim than any hours promise.

**Reference number format:** `SM-` + last 6 characters of the submission `cuid`, uppercased (e.g. `SM-K3F9QA`). No schema change, unique in practice, short enough to read over the phone.

**Urgency tiers** (drives the notification subject prefix only):

| Tier | Subjects |
|---|---|
| Urgent | Activation Issue, Connectivity Problem, Refund Request, Billing & Payment |
| Normal | Installation Help, General Inquiry |

Rationale: the first two mean a paying customer is abroad without data; the last two are money, and money left unanswered becomes a chargeback.

**Self-help links in the auto-reply**, by selected subject:

| Subject | Links |
|---|---|
| Installation Help | `/{locale}/installation-guide`, `/{locale}/compatible-devices` |
| Activation Issue | `/{locale}/help`, `/{locale}/account` |
| Connectivity Problem | `/{locale}/help` + three inline steps (restart device, enable data roaming on the eSIM line, select network manually) |
| Refund Request | `/{locale}/refund` |
| Billing & Payment | `/{locale}/account`, `/{locale}/terms` |
| General Inquiry | `/{locale}/help` |

## Resolved decision

**Single support mailbox: `info@sim2me.net`** — confirmed by Gabriel, 2026-07-31. `support@sim2me.net` (seed, `AccountClient.tsx`) is retired in favour of it. G4 is unblocked.

## Risks

| Risk | Mitigation |
|---|---|
| Auto-reply send fails and blocks the API response | Fire-and-forget with `.catch(console.error)` — the existing pattern in `email.ts`. Saving to DB stays the only blocking step. |
| Auto-reply lands in spam and looks like we ignored them | Send from the existing verified `RESEND_FROM_EMAIL`; `replyTo` set to the real support mailbox so a reply reaches a human. |
| Auto-reply becomes a spam amplifier via a forged email address | Turnstile + the existing 3-per-60s IP rate limit already gate the endpoint before any send. |
| Lowering the advertised SLA hurts conversion | The trust chip gains a concrete, credible claim ("human support", "in Hebrew") in place of a generic one; credibility here is worth more than the number. |
