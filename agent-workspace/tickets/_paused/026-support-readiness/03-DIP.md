# Ticket 026 — DIP

Scope: minimum viable support — customer auto-reply, honest SLA copy, actionable admin notification, one support address.
Local only. No commit, no deploy.

## Gate — before any code
- ⬜ Gabriel approves scope (PRD goals G1–G5, non-goals confirmed deferred)
- ⬜ **BLOCKED** — Gabriel approves the SLA copy (he/en/ar). See "Copy — unresolved" below; the table in `01-PRD.md` was **not** accepted.
- ✅ Live mailbox confirmed: **`info@sim2me.net`** (2026-07-31)
- ⬜ Note: tickets 019–025 are still uncommitted in the working tree, pending Gabriel's browser review. This ticket touches a disjoint set of files except `src/messages/{he,en,ar}.json`, which ticket 025 also edited. Backups below must be taken from the current working tree, not from HEAD.

## Phase 0 — Safety
- ⬜ Backup to `agent-workspace/tickets/026-support-readiness/backup/`:
  `email.ts`, `api/contact/route.ts`, `ContactForm.tsx`, `he.json`, `en.json`, `ar.json`,
  `brand.ts`, `seed.ts`, `AccountClient.tsx`, `ContactSubmissionsClient.tsx`
- ⬜ Confirm `npm run dev` is up and `/he/contact` renders before touching anything

## Phase 1 — Reference number
- ⬜ Create `src/lib/contactRef.ts` with `contactRef(id)` → `SM-XXXXXX`
- ⬜ Show the reference on each row in `/admin/contact` (`ContactSubmissionsClient.tsx`), so Gabriel can match an email to a record
- ⬜ Verify against a real row in the local DB that the rendered reference matches what the formatter produces

## Phase 2 — Auto-reply email
- ⬜ Add optional `replyTo` param to `sendEmail()` in `email.ts`; confirm the nine existing call sites still typecheck
- ⬜ Add `CONTACT_AUTOREPLY_COPY: Record<EmailLocale, {...}>` — greeting, body, SLA line, reference label, sign-off
- ⬜ Add the subject → self-help links map (6 subjects, per the PRD table); paths prefixed `/{locale}`
- ⬜ Implement `sendContactAutoReplyEmail(data, locale)` using `logoImgTag()`, `baseUrl()`, `dir` by locale
- ⬜ Verify link targets actually resolve: `/installation-guide`, `/compatible-devices`, `/help`, `/refund`, `/account`, `/terms`

## Phase 3 — Contact route
- ⬜ Capture the created row, derive `ref`
- ⬜ Add `URGENT_SUBJECTS` set; build the subject line `[URGENT] [Sim2Me] {subject} — {ref}`
- ⬜ Admin email: add phone row (`tel:` link), reference row, `/admin/contact` deep link — all through the existing `escapeHtml`
- ⬜ Replace the hardcoded `gavriel.kr@gmail.com` with `ADMIN_NOTIFICATION_EMAIL` + fallback
- ⬜ Make both sends fire-and-forget (`.catch(console.error)`); DB write stays the only blocking step
- ⬜ Trigger the auto-reply with `replyTo` = support address
- ⬜ Return `{ success: true, ref }`
- ⬜ Confirm the no-`RESEND_API_KEY` dev path still returns success and logs

## Phase 4 — Copy
- ⬜ `home.trustSupport` — replace the 24/7 claim ×3 locales
- ⬜ `contact.responseTime` — replace "within a few hours" ×3 locales
- ⬜ `contact.messageSentDesc` — mention the confirmation email ×3 locales
- ⬜ `contact.refSent` — new key ×3 locales
- ⬜ `ContactForm.tsx` — send `locale` via `useLocale()`, render `ref` on the success screen
- ⬜ Grep the whole repo for any remaining `24/7` / `24-7` / "few hours" support claim

## Phase 5 — Support address (unblocked: `info@sim2me.net`)
- ⬜ Set the confirmed address in `src/config/brand.ts`
- ⬜ Align `prisma/seed.ts` default
- ⬜ Check the local DB `site_settings.support_email` row and update it if it holds the old value — editing the seed does not touch an existing row
- ⬜ Replace the two hardcoded mailto addresses in `AccountClient.tsx` with `brandConfig.supportEmail`
- ⬜ Grep for the four known addresses; confirm only intentional occurrences remain (admin-notification addresses are expected to differ from the public one)

## Phase 6 — Verification
- ⬜ `npx tsc --noEmit` clean
- ⬜ `ReadLints` clean on every touched file
- ⬜ `npx next build` passes
- ⬜ Submit the form in he, en, and ar on localhost; for each: submission appears in `/admin/contact`, success screen shows the reference, auto-reply arrives in the right language with correct `dir`, links work
- ⬜ Submit with an urgent subject (Activation Issue) → notification subject carries `[URGENT]`; submit with General Inquiry → it does not
- ⬜ Confirm the admin notification contains the phone number and that `Reply` targets the customer
- ⬜ Confirm the customer auto-reply's `Reply` targets the support mailbox
- ⬜ Simulate a Resend failure (bad API key) → the submission is still stored and the customer still sees success
- ⬜ Regression: `/he`, `/en`, `/ar` return 200 and the trust strip renders the new string
- ⬜ Regression: password reset, post-purchase and OTP emails still send (shared `sendEmail` was modified)
- ⬜ Update `CHANGELOG.md` under `[Unreleased]`

## Copy — unresolved (blocks Phase 4 only)

Gabriel rejected every SLA variant offered: **he cannot commit to any response-time promise right now.** Also rejected: the outcome guarantee ("didn't connect? we fix it or refund"), which additionally conflicts with the published refund policy (`faq.answerRefundPolicy`: no refund after activation).

**Unblocking path — deleting a false claim does not depend on choosing the replacement.** `"תמיכה 24/7"` can be removed and replaced with a true, non-temporal statement (a language or human-support claim in the hero chip; "we read every message" on the contact page, with no number). A time commitment can be added later, once he knows he can meet it.

Consequence for Phase 2: if no SLA is agreed, the auto-reply ships **without** a time promise — reference number, acknowledgement, and self-help links only. G1–G3 and G5 are unaffected; only G2 degrades to "remove the false claim".

Still undecided: hero chip wording, contact-page wording, whether any number is stated at all.

## Status log
- 2026-07-31: Ticket opened. Awaiting Gate approval.
- 2026-07-31: Decisions from the review conversation — mailbox confirmed as `info@sim2me.net` (Phase 5 unblocked); SLA copy rejected outright, no time commitment possible at this stage (Phase 4 blocked, see above); outcome-guarantee direction rejected.
- 2026-07-31: Gabriel is building something support-related in parallel. This ticket is **paused** until that lands, at which point its scope will be re-cut against whatever the parallel work already covers.

## Notes / follow-ups
- Deferred to their own tickets: in-form deflection UI, guest order lookup + QR resend, WhatsApp channel, replying from `/admin/contact`, AI first-line.
- Reply-from-admin is the natural next step once volume passes roughly 20 submissions/week — until then replying from the mailbox is fine, and the reference number in the subject keeps threads matchable by hand.
- **AI support chat** — discussed at length; no ticket opened. Two levels: (1) a bot answering from existing FAQ/help content — hours of setup, deflects informational questions only; (2) an agent with tool access that diagnoses the specific customer — realistically 1–2 weeks here, because the tool layer already exists: `getEsimUsage()` (`lib/esimaccess.ts`), order lookup by email, `resend-email`, `retry`, `sendOtpEmail()` for identity verification, plus the 3-language FAQ/guide corpus. Hard constraint: read tools unrestricted, write tools only where irreversible harm is impossible, **refund and eSIM cancellation never AI-controlled**. Does not remove the need for this ticket — escalations and direct emails still land in the mailbox.
- `brandConfig.helpButton` is set to `'whatsapp'` but `StickyHelpButton.tsx` links to `/contact`. Harmless today; worth reconciling whenever WhatsApp is decided either way.
