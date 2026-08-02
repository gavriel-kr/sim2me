# Ticket 033 — Detailed Implementation Plan (DIP)

Status icons: ⬜ open · ✅ done · ⛔ blocked

**Where this stands:** every phase through verification is complete and green. Nothing has been
deployed. Deployment is deliberately held, because a fault found during this work means none of it
would reach a customer yet — see Phase 9 and the block at the bottom.

## Phase 0 — Safety ✅

- ✅ `backup/` holds all 8 files as they were before the first edit
- ✅ Ticket 032 confirmed deployed and confirmed not to have touched `src/lib/email.ts`
- ✅ Five callers of `sendPostPurchaseEmail` enumerated

## Phase 1 — Schema ✅

- ✅ `locale String?` on `Order`, one line, purely additive
- ✅ Dry run first: `prisma migrate diff` printed exactly one statement,
  `ALTER TABLE "orders" ADD COLUMN "locale" TEXT;` — no drift, nothing else pending
- ✅ Applied. `DIRECT_URL` is absent from `.env`, so it was supplied for the one command from
  `DATABASE_URL` (Prisma Postgres, direct connection, no pooler) and cleared afterwards
- ✅ `prisma generate`, `tsc --noEmit` clean
- ✅ Before/after snapshots byte-identical: 19 orders, 16 completed, $56.74 revenue, every field on
  every sampled row unchanged. Proofs in `proofs/db-before.json` and `proofs/db-after.json`

## Phase 2 — Character PNGs ✅

- ✅ `public/characters/email/` — `pair-checking-phone-v1`, `pair-explaining-v1`,
  `pair-reassuring-v1`, `simi-waving-v1`
- ✅ Cut from the WebP the site already serves, so inbox and site are the same pixels
- ✅ 300 px tall, rendered at 150; 27–46 KB each; alpha preserved; fade baked in
- ✅ Every one inspected: the phone, the open palm, the hand on chest, the explaining gesture and
  the waving hand are all inside the crop
- ✅ Existing `public/characters` untouched, still 42 files

## Phase 3 — `src/lib/email.ts` ✅

- ✅ `sendEmail` gains optional `text`, `replyTo`, `attachments`; all existing callers unchanged
- ✅ `PostPurchaseEmailData` gains optional receipt fields
- ✅ Receipt renders in he/en/ar; absent fields omit their row entirely
- ✅ QR fetched and attached behind a 5 s timeout and a 2 MB ceiling; failure falls back exactly
- ✅ `sendOrderDelayedEmail` — new, three locales, no error text
- ✅ Characters wired into all five customer templates
- ✅ Plain-text alternative on every customer email
- ✅ Admin templates unchanged apart from the balance row; no characters in admin mail
- ✅ Verification and OTP gained Arabic; the OTP mechanism stays disabled in `auth.ts`

## Phase 4 — Call sites ✅

- ✅ `webhooks/paddle`: persists `locale`
- ✅ `webhooks/paddle`: receipt fields on the success email
- ✅ `webhooks/paddle`: delayed email when `firstProfile` is missing
- ✅ `webhooks/paddle`: delayed email in the `catch`
- ✅ `webhooks/paddle`: underpayment branch **proven untouched** — the diff's only match inside it
  is the import line, and it returns at line 244 before any customer send is reachable
- ✅ `admin/orders/[id]/retry`, `account/orders/[id]/retry`, `admin/orders/[id]/resend-email`
- ✅ `admin/orders/internal`: receipt fields, persists its admin-chosen locale
- ✅ Account links carry a locale prefix everywhere
- ✅ `contact/route.ts`: `ADMIN_NOTIFICATION_EMAIL`, no hardcoded address

## Phase 5 — Admin balance ✅

- ✅ `getBalance()` behind `Promise.race` + 4 s timeout inside the detached notification chain
- ✅ Red below `ESIM_BALANCE_ALERT_USD` (default $20)
- ✅ `null` renders a dash and the email still sends
- ✅ Proven absent from every customer email by assertion, not by inspection

## Phase 6 — Preview tooling ✅

- ✅ `email-preview.ts` — `--write` and `--send`, every template × he/en/ar
- ✅ `email-verify.mjs` — assertions over the rendered HTML
- ✅ `email-behavior.mjs` — the failure modes
- ✅ Nothing added under `src/` except the preview sink inside `sendEmail`, which is inert unless
  `EMAIL_PREVIEW_DIR` is set and imports `node:fs` dynamically

## Phase 7 — Verification ✅

- ✅ `npx tsc --noEmit` → 0
- ✅ `npm run lint` → 0 (warnings only, all pre-existing)
- ✅ `npm run test:profit`, `npm run test:locale-path` → pass
- ✅ `npx next build` → 0
- ✅ 47 rendered-output assertions pass: no `undefined` or `[object Object]` anywhere, `dir` correct
  per locale, receipt complete in all three languages, account links locale-prefixed, characters
  present, no AVIF or WebP in any body, text part present and tag-free
- ✅ 20 behaviour assertions pass: `toEmailLocale` maps null/undefined/""/unknown to Hebrew; a caller
  passing none of the new fields renders valid Hebrew with no empty rows; an unreachable QR still
  sends with the receipt intact; a null balance renders a dash and is not flagged low
- ✅ Underpayment path re-read line by line: two admin sends, then `return`

## Phase 8 — Samples ✅

- ✅ 12 emails rendered to `proofs/emails/`, with an `index.html` contact sheet
- ✅ All 12 sent and **confirmed `delivered`** by the Resend API
- ✅ Re-sent to `info.sim2me@gmail.com` on 2026-08-03 once the domain was verified. 16 templates
  plus a smoke test, **all 17 confirmed `delivered`**, all from `info@sim2me.net`

## Phase 10 — One language per email (2026-08-03)

Raised on reviewing the samples: the verification and OTP emails still carried all three languages
in one body, which is what the rest of the ticket set out to end.

- ✅ `VERIFY_COPY` and `OTP_COPY` copy tables, matching the five templates that already had them
- ✅ Locale threaded from the originating page through six call sites — register,
  resend-verification, `otp/resend`, `otp/send-setup`, `otp/disable`, and the commented
  `OTP_RESTORE` block in `auth.ts` — using the pattern `forgot-password` already established
- ✅ Both functions default to Hebrew, so an un-updated caller behaves as before
- ✅ `reset-password` marks `emailVerified`, closing the loop where a customer could complete a
  reset, be told to sign in, and be refused by the check in `auth.ts`. Approved explicitly, as an
  auth-adjacent change
- ✅ `email-preview.ts` purges its output directory first — a subject change renames the file, and
  the previous run's copy was sitting beside the new one looking equally current, which is how two
  stale trilingual samples nearly passed as current
- ✅ New checker `email-lang-check.mjs`: asserts no rendered email contains both Hebrew and Arabic.
  16/16 pass — 5 Hebrew, 5 Arabic, 5 English, 1 admin
- ✅ `email-verify.mjs` now measures the text part in lines rather than bytes. The 200-byte floor
  was tuned to the long templates and failed a single-language OTP mail for being concise
- ✅ tsc, lint, `next build`, `email-verify`, `email-behavior` all green

## Phase 9 — Deploy (R3) — HELD

- ✅ Gate A: build, lint, tests, typecheck all green
- ✅ Gate B: money path answered — the underpayment branch is untouched and proven so; the balance
  lookup is detached and timeout-capped; no change to pricing, charging or auth
- ⬜ Backup tag `pre-deploy-YYYYMMDD-HHMM`
- ⬜ Written rollback plan
- ⬜ `git push origin main`
- ⬜ Post-deploy smoke

**Held for approval only.** The delivery blocker below cleared on 2026-08-03, so the reason for
holding is no longer technical.

One thing cannot be proven until the deploy happens: the character images resolve against
`https://www.sim2me.net/characters/email/*.png`, and those four files exist only locally. Every
sample sent so far shows a broken image where Simi and Sima belong. Nothing to fix — the files ship
with the deploy — but the design cannot be judged from the current samples. Either push a branch and
let Vercel build a preview URL that serves them, or deploy and re-send one sample to confirm.

## ✅ The blocker — CLEARED 2026-08-03

`sim2me.net` is verified on its own Resend account, separate from the one holding `valentyns.com`,
since the free plan allows one domain per account. DKIM, SPF and the feedback MX are live on
`send.sim2me.net`; the root MX is untouched, so `info@sim2me.net` still receives.

Note for the record: `_dmarc.sim2me.net` was already published at `p=quarantine` by a previous
registrar, with `rua` pointing at an address nobody here reads. That made the DNS work mandatory
rather than cosmetic — the first mail from the domain without correct DKIM would have been
quarantined on arrival.

Verified with `resend-status.mjs` (domain verified, from-address matches), `resend-smoke.mjs` (one
live send, polled to `delivered`) and `resend-delivery-report.mjs` (17/17 `delivered`).

### What it looked like before — not a code fault, and it predates this ticket

`sim2me.net` has no Resend DNS records: no DKIM at `resend._domainkey`, no `send.sim2me.net`, and an
SPF pointing at Cloudflare rather than Amazon SES. The domain therefore cannot be verified, and an
unverified Resend account may only deliver to its own owner.

Confirmed against the account's full send history — 100 records back to 2026-05-12:

- every email ever sent went to exactly one address, `gavriel.kr@gmail.com`
- every one was sent from `onboarding@resend.dev`, never from `@sim2me.net`
- 16 completed orders across 8 distinct customers; **7 of those customers have never been sent
  anything**, including two who paid today

Everything else is rejected `403` and swallowed by the `catch` in `sendEmail` — which is correct
behaviour, since a mail failure must never fail an order, and is exactly why sixteen orders
completed without anyone noticing.

Also found: `RESEND_FROM_EMAIL` in the local `.env` is the placeholder `noreply@yourdomain.com`, and
the production value appears to be unset entirely, since every historical send fell through to the
`onboarding@resend.dev` default.

Full audit: `proofs/delivery-audit.txt`. Reproduce with
`node agent-workspace/scripts/ticket-033-delivery-audit.mjs`.
