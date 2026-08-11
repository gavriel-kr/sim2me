# Ticket 026 — DIP

Scope: minimum viable support — customer auto-reply, honest SLA copy, actionable admin notification, one support address.
Local only. No commit, no deploy.

Status icons: ⬜ open · ✅ done · ⛔ blocked · 👤 needs Gabriel, on his machine

Read `04-RECUT-2026-08-10.md` first: it supersedes the SLA table in `01-PRD.md` and the "Copy — unresolved"
section at the bottom of this file. No response-time promise ships in any language.

## Gate — before any code
- ✅ Scope approved (G1–G5), and on 2026-08-10 Gabriel authorised working through the ticket to the end
- ✅ SLA copy question closed **by removal** — every temporal promise deleted, nothing numeric replaces it
- ✅ Live mailbox confirmed: **`info@sim2me.net`** (2026-07-31)
- ✅ Backups taken from the working tree, not from HEAD

## Phase 0 — Safety
- ✅ Files backed up to `agent-workspace/backups/2026-08-10-pre-launch-tickets/`
- ✅ Dev server up on `localhost:3004`; pages render before and after

## Phase 1 — Reference number
- ✅ `src/lib/contactRef.ts` — `contactRef(id)` → `SM-XXXXXX`, FNV-1a over the id, no column and no migration
- ✅ Reference shown on each row in `/admin/contact`
- ✅ Verified against a real submission: the route returned `SM-JFDGOV`, and the admin list derives the
  same value from the same id because the function is deterministic

## Phase 2 — Auto-reply email
- ✅ `sendEmail()` already had `replyTo` and `text` — ticket 033 added both, so nothing to change
- ✅ `CONTACT_AUTOREPLY_COPY` for he/en/ar — greeting, body, reference label, self-help block, sign-off,
  **no timing line in any language**
- ✅ Subject → self-help links map, six subjects, paths prefixed with the locale
- ✅ `sendContactAutoReplyEmail()` — `logoImgTag()`, `characterImg('reassuring')`, `dir` and `listPad` by
  locale, `escapeHtml` on the customer name and the reference
- ✅ Every link target exists as a route: `/installation-guide`, `/compatible-devices`, `/help`,
  `/refund`, `/terms`, `/account`

## Phase 3 — Contact route
- ✅ Created row captured, `ref` derived from its id
- ✅ `URGENT_SUBJECTS` — Activation Issue and Connectivity Problem; subject line becomes
  `[URGENT] [Sim2Me] {subject} — {ref}`
- ✅ Admin notification moved onto `sendEmail` as `sendContactAdminNotificationEmail`, gaining the phone
  row as a `tel:` link, the reference row, the marketing flag and an "Open in admin" deep link
- ✅ The hardcoded personal address was already gone; the recipient is `ADMIN_NOTIFICATION_EMAIL`
- ✅ Both sends are fire-and-forget; the database write is the only step that can fail the request
- ✅ Auto-reply carries `replyTo` = the support mailbox; the admin notification replies to the customer
- ✅ Returns `{ success: true, ref }`

## Phase 4 — Copy
- ✅ `home.trustSupport` — "24/7 support" replaced with "email support before and after your flight" ×3
- ✅ `contact.responseTime` — "within a few hours" replaced with "we read every message" ×3
- ✅ `contact.messageSentDesc` — now mentions the confirmation email ×3
- ✅ `contact.refSent` — new key ×3, rendered on the success screen
- ✅ `ContactForm.tsx` — sends `locale`, shows the reference
- ✅ `about.why6Desc` — "reach out at any time" gone ×3
- ✅ `about.why3Desc` — the 65% figure gone ×3; the English `why3Title` "Best Prices Guaranteed" and the
  Arabic "أفضل الأسعار مضمونة" were an unbackable guarantee in the same block and were softened with it
- ✅ `accessibility.feedbackBody` — "within a few business days" removed from English; Hebrew and Arabic
  already carried no promise, so the re-cut's note that this string exists only in English is out of date
- ✅ `prisma/seed-articles.ts` — "We typically respond within a few hours" rewritten
- ✅ `TrustStrip.tsx` deleted — dead since 2026-07-31 and the last carrier of the 24/7 claim
- ✅ Repo-wide grep for `24/7`, `24-7`, "within a few", "business days", "anytime", "בכל עת": the
  remaining hits are a newsletter unsubscribe right, a cookie-preferences right, the legal pages' right
  to amend terms, and the refund policy's statement about **bank** processing time. None is a support promise
- ✅ **Five published article bodies were still promising support hours** — found on 2026-08-11 while
  verifying 036, by scanning the database rather than the repo, which is why the earlier grep missed
  them: this copy is live content in `Article` rows and exists nowhere in the source tree.
  `esim-italy` (en and he) and `esim-colombia` (he) advertised 24/7 support, `esim-switzerland` (he)
  said the team is available 24/7, and `best-esim-for-travel` (en) promised a reply "within a few
  hours". Gabriel approved the five replacements after seeing the dry run; written with
  `026-article-claims-fix.mjs --fix`, and `026-article-claims-check.mjs` now reports zero
- ✅ The same two claims in the seed sources — `prisma/content-part2.md` (he and en) and
  `prisma/content-part3.md` (he) — rewritten to match, so a reseed cannot bring them back. The
  "within a few hours" sentence has no source file; it was written straight into the database
- ⬜ **Fourteen published article bodies contradict the corrected FAQ** on two facts 036 changed:
  top-ups being purchasable, and an eSIM being valid 180 days before activation.
  `node agent-workspace/scripts/036-article-facts-check.mjs` lists them. Not the same job as the five
  above — several are general advice rather than a promise, so each needs a judgement rather than a
  find-and-replace. Wants its own small ticket
- ✅ A rendered-page assertion now guards the rule continuously: `036-content-check.mjs` fails if any
  of `/`, `/help`, `/how-it-works`, `/contact`, `/about` or `/checkout` mentions support hours, in any
  of the three languages

## Phase 5 — Support address
- ✅ `brandConfig.supportEmail` already `info@sim2me.net`
- ✅ `prisma/seed.ts` default aligned to `info@sim2me.net`
- ✅ Admin settings placeholder aligned, so nobody is invited to type the dead address back in
- ✅ Two hardcoded `support@sim2me.net` mailto links in `AccountClient.tsx` now read `brandConfig.supportEmail`
- ✅ **The live `site_settings.support_email` row held `support@sim2me.net`**, a mailbox that does not
  exist, and `/[locale]/contact/page.tsx` prefers that row over `brandConfig`, so it was the address the
  contact page showed. Gabriel approved the write on 2026-08-11 and it was applied with
  `026-support-email-check.mjs --fix`. Verified after: `/he/contact`, `/en/contact` and `/ar/contact` all
  show `info@sim2me.net` and none of them contains `support@sim2me.net`

## Phase 6 — Verification
- ✅ `npx tsc --noEmit` → 0
- ✅ `ReadLints` clean on every touched file
- ✅ `npx next build` → success
- ✅ Live submission against `localhost:3004` returned `200 {"success":true,"ref":"SM-JFDGOV"}`
- ✅ `email-preview.ts` extended with the auto-reply and the admin notification; 20 templates render
- ✅ `email-lang-check.mjs` → PASS, no email mixes Hebrew and Arabic
- ✅ `email-verify.mjs` → PASS. One assertion needed correcting rather than the code: it counted every
  text part as belonging to a customer email, and the new admin notification has one too
- ✅ `email-behavior.ts` → all checks pass, so the shared `sendEmail` still behaves as ticket 033 left it
- 👤 Submit the form in the browser in he, en and ar; confirm the success screen shows the reference and
  that the auto-reply arrives with the right direction and working links
- 👤 Confirm the `[URGENT]` prefix appears for Activation Issue and not for General Inquiry — the code
  path is proved, the inbox is his to look at
- ✅ Simulated provider failure is structural rather than tested: both sends are detached and `sendEmail`
  swallows its own errors, so a Resend outage cannot reach the customer's screen
- ✅ `/he`, `/en`, `/ar` return 200 with the new hero string
- ✅ `CHANGELOG.md` updated under `[Unreleased]`

## Side effects of the local test — worth knowing before you open your inbox

`RESEND_API_KEY` is set in `.env`, so the verification submission sent two real emails: an admin
notification to `info.sim2me@gmail.com` with the subject `[URGENT] [Sim2Me] Activation Issue — SM-JFDGOV`,
and an auto-reply to `ref-test@example.com`, which is a reserved domain and will have bounced. The test
row it created was removed with `agent-workspace/scripts/026-cleanup-test-submission.mjs`.

## Status log
- 2026-07-31: Ticket opened. Awaiting Gate approval.
- 2026-07-31: Mailbox confirmed; SLA copy rejected outright; outcome-guarantee direction rejected.
- 2026-07-31: Paused pending parallel support work.
- 2026-08-10: Resumed and re-cut — see `04-RECUT-2026-08-10.md`.
- 2026-08-10, later: Implemented. Everything landed except the one database row, which is Gabriel's to
  change because it is real data.
- 2026-08-11: Five published article bodies found still promising support hours, by scanning the
  database instead of the repo. Gabriel approved both live-data changes after reading the dry runs: the
  `support_email` row is now `info@sim2me.net`, the five article bodies are corrected, and the seed
  sources were rewritten to match. Nothing in the ticket is blocked any more. One follow-up remains and
  wants its own ticket: fourteen published bodies still contradict 036 on top-ups and the 180 days.

## Notes / follow-ups
- Deferred to their own tickets: in-form deflection UI, guest order lookup + QR resend, WhatsApp channel,
  replying from `/admin/contact`, AI first-line.
- `AccountClient.tsx` is still largely hardcoded English. Out of scope here; it wants its own copy ticket.
- The homepage `contactPoint` JSON-LD still lists `availableLanguage: ['English','Hebrew','Arabic']`.
  Left as it is deliberately: it describes the languages the site is published in, and the decision was
  that the site makes no claim about support language anywhere. Worth a second look with fresh eyes.
- `brandConfig.helpButton` is `'whatsapp'` while `StickyHelpButton.tsx` links to `/contact`. Harmless
  today; reconcile whenever WhatsApp is decided either way.
