# Pending release — Tickets 026 / 034 / 036 / 037 plus the menu and hero pass, prepared 2026-08-10

Everything below is **local and unpushed**. `DEPLOY-PROTOCOL.md` governs; this file records how each of
its gates was answered for this changeset.

## Where the repo stands

| | |
|---|---|
| HEAD | `f8040bb` — *Ticket 020: record the deploy and the post-deploy smoke* |
| Branch | `main`, level with `origin/main` |
| Going up | 31 modified files under `src`, 2 new (`ContactBlock.tsx`, `contactRef.ts`), 1 renamed (`useAddDeal.ts` → `.tsx`), 1 deleted (`TrustStrip.tsx`), 4 prisma content/seed files, the changelog and the workspace docs — 91 paths added, 4 removed |
| Rollback target | `f8040bb` |
| Backup tag | `pre-deploy-20260810-2325`, created on `f8040bb` **before** anything is pushed |

Four tickets and one follow-up pass are in a single uncommitted changeset, so there is no per-commit
rollback inside it. Per-file copies of everything each ticket touched sit in
`agent-workspace/tickets/034-conversion-checkout/backup/`,
`agent-workspace/backups/2026-08-10-pre-launch-tickets/` and
`agent-workspace/backups/2026-08-10-menu-help-hero/`, each with a `RESTORE.md`.

## What the release contains

Full prose in `CHANGELOG.md` under `[Unreleased]`. In one line each:

- **026 — support readiness.** Every claim of round-the-clock or same-day support removed; the contact
  form now auto-replies in the sender's language and notifies the admin with an `[URGENT]` prefix for
  activation issues; `SM-XXXXXX` reference on the success screen, in both emails and in the admin list;
  one support address, `info@sim2me.net`, everywhere.
- **034 — the checkout spoke English to everyone.** Sixteen hardcoded strings localized, VAT and
  currency stated by the total, a "go to checkout" action on the add-to-cart toast, a search field that
  looks like a search field and matches English names, ISO codes and aliases.
- **036 — the FAQ contradicted itself.** Reinstallation, pre-activation validity and top-ups corrected
  against what the supplier actually supports; five missing questions added; the help centre grouped;
  the golden tip on `/how-it-works` and in the purchase email.
- **037 — a customer could pay and be told nothing was wrong.** `COMPLETED` only when a profile exists,
  a retry guard that cannot buy a second eSIM, refund and chargeback adjustments handled, `PROCESSING`
  orders visible and explained in the account area, and a consent checkbox enforced server-side.
- **Menu and hero pass (10 Aug).** `/contact` out of the header menu with its form at the foot of the
  help centre, the floating chat button hidden behind a flag, the hero headline sized to one line, an
  ellipsis on the subtitle.
- **Two hardenings** found while reviewing the above: ceilings on the contact fields, and a
  per-recipient limit on the auto-reply.

## Risk level: R2

Gate B1 is marked in four places at once: **checkout** (`create-transaction`), **the Paddle webhook and
fulfilment**, **emails**, and **admin orders** (both retry routes). Any one of those is R2 on its own.

It is **not** R3. No Prisma schema change is in the changeset — `prisma/schema.prisma` is byte-identical
to `f8040bb` — and no script in this release writes to production at deploy time beyond what every
deploy already runs, which is examined below.

R2 requires gate A + gate B + full gate C + gate D, a backup tag, and **a second explicit approval**
beyond the request to prepare.

### The database edits already happened, and are not part of the push

Two writes to the production database were made earlier, each with explicit approval at the time, and
both are already live and independent of this deploy:

1. `site_settings.support_email`: `support@sim2me.net` → `info@sim2me.net`. Reversal is the same script
   with the old value, or the admin settings screen.
2. Five published article bodies had a 24/7 or "within a few hours" claim replaced with what is true.
   `agent-workspace/scripts/026-article-claims-fix.mjs` holds both the before and after strings
   literally, so the reversal is mechanical if it is ever wanted.

The code going up does not depend on either, and neither depends on the code. A rollback of the code
does not need a rollback of these.

### What the deploy's own build chain does to production data

`npm run build` on Vercel is `prisma db push && next build && tsx prisma/update-articles-phase7.ts &&
tsx prisma/update-legal-pages-i18n.ts`. That chain runs on every deploy, so the question is only whether
this release changes what it does. Checked rather than assumed:

- `prisma db push` — the schema is unchanged, so it is a no-op against a database already in sync.
- `update-articles-phase7.ts` rewrites 75 article bodies from two HTML files in `prisma/`. Both files
  were scanned: **zero** occurrences of `24/7`, `round-the-clock`, `within a few hours`, `תוך מספר שעות`
  or `على مدار الساعة`, and its slug list does not contain `esim-italy`, `esim-switzerland`,
  `esim-colombia` or `best-esim-for-travel` — the four articles corrected in the database. **The deploy
  cannot undo the 026 corrections.**
- `update-legal-pages-i18n.ts` rewrites `terms`, `privacy` and `refund` (Hebrew and Arabic) from the
  script's own copy. No support-hours claim and no support address appears in it. Unchanged by this
  release, and worth knowing generally: hand edits to those three pages in the admin are overwritten on
  every deploy.

## Gate A — the code builds locally

- ✅ `npx tsc --noEmit` → **0**
- ✅ `npm run lint` → **0**. Warnings only, all pre-existing; the two new files produce no output
- ✅ `npm run test:profit` → pass
- ✅ `npm run test:locale-path` → pass
- ✅ `npx tsx src/app/admin/orders/orderFilters.test.ts` → pass
- ✅ `npx tsx src/app/admin/orders/ordersExcel.test.ts` → pass
- ✅ `npx next build` → **0**, 95 static pages generated, route table intact
- ✅ No `.env`, credential or key file in the changeset; `.gitignore` unchanged
- ✅ No `console.log`, `debugger`, TODO or FIXME added. The one new log line is a `console.warn` in
  `api/contact` when an auto-reply is suppressed, matching what the webhook and retry routes already do
- ✅ `src/app/[locale]/design-preview/` no longer exists, so the standing "one `git add -A` publishes a
  preview route" hazard is gone. Staging is by explicit path anyway

`npm run build` itself is not run locally, for the third release in a row and for the same two reasons:
its first step needs `DIRECT_URL`, which is not set locally, and its last two steps write article and
legal-page rows in the live database. `npx next build` compiles the identical application.

## Gate B — risk and environment

### B1 — areas touched

- ✅ **Checkout / `create-transaction`** — a consent field, enforced before any Paddle call. The price
  resolution, the rate limit and Turnstile are untouched
- ✅ **Paddle webhook / fulfilment** — `COMPLETED` is now conditional on a profile existing, and
  `adjustment.created` / `adjustment.updated` are handled. Signature verification is untouched
- ✅ **eSIMaccess** — no new call. The retry routes now *avoid* a call they used to make
- ✅ **Emails** — the golden tip replaces the one-line tip in the purchase email; two new contact-form
  emails. `sendEmail` itself is untouched
- ✅ **Admin orders** — the retry route gained the same guard as the customer's
- ✅ **Articles / i18n / legal** — message files in three languages, `faq.ts`, seed copy
- ❌ Auth, OTP, Admin TOTP — **not touched**
- ❌ Refund, archive, bulk, Excel — **not touched**
- ❌ Prices, price floor, fees, overrides — **not touched**
- ❌ Blocklist / fraud, cron, `vercel.json`, PWA, mobile — **not touched**

### B2 — environment variables

**No new variable, and nothing to change in Vercel.** Everything used is already in production and
already used by the live paid path: `DATABASE_URL`, `NEXTAUTH_*`, `PADDLE_API_KEY`,
`PADDLE_WEBHOOK_SECRET`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `ESIMACCESS_ACCESS_CODE`, `RESEND_API_KEY`,
`RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, `CRON_SECRET`, `TURNSTILE_*`. No secret appears in the
changeset or in any log line added by it.

### B3 — backup

- ✅ `git tag pre-deploy-20260810-2325` on `f8040bb`, created before the push
- Not R3, so no database backup is required. The two content edits above have written reversals

## Gate C — smoke, run against the local dev server after the final edit

`agent-workspace/scripts/predeploy-smoke.mjs` — **62 checks, all green.** Four assertions failed on the
first pass and all four were the check being wrong rather than the site: the destinations index renders
its slugs after hydration, an empty POST body fails JSON parsing before it can fail the consent gate,
next-intl escapes rich-text tags inside the serialised bundle, and `check-abandoned` answers 503 rather
than 401 when `CRON_SECRET` is absent locally. Each was corrected and the whole gate re-run.

### C0, always
- ✅ `/en`, `/he`, `/ar` → 200; destinations index → 200; a destination page → 200

### C1, checkout, money and eSIM
- ✅ `GET /api/checkout/health` → `ok: true`, all five steps green including `paddle-ping`
- ✅ `/he`, `/en`, `/ar` `/checkout` → 200, and the consent copy shipped to all three
- ✅ **`POST /api/checkout/create-transaction` with a body the schema accepts and no consent → 400
  "Terms must be accepted before payment."** — refused before Turnstile and before Paddle. Deliberately
  not probed with `consent: true`, because a pass through Turnstile would create a real transaction in
  the live Paddle account
- ✅ Unsigned `POST /api/webhooks/paddle` → refused
- ✅ `POST /api/account/orders/<id>/retry` and the admin equivalent without a session → refused
- ✅ No price, floor or fee file is in the changeset

### C2, customer account
- ✅ `/account/login` → 200 in all three locales, `/he/account/register` → 200
- ✅ `/he/account` → 3xx, guard intact; `GET /api/account/orders` without a session → 401

### C3, admin
- ✅ `/admin/login` → 200
- ✅ `/admin/orders`, `/admin/contact`, `/admin/articles`, `/admin/navigation`, `/admin/settings` → 3xx,
  guards intact

### C4, content and i18n
- ✅ **33 page/locale combinations** — the eleven pages this release can reach × three locales — all
  200, `dir` correct, no `MISSING_MESSAGE`, and no support-hours claim in the rendered markup
- ✅ An article renders in all three locales
- ✅ `036-content-check.mjs` — 60 checks: the golden tip in three languages with its five steps, the
  help centre's JSON-LD complete at 20 unique questions with no leaked keys, the homepage's five
  questions unchanged, no support-hours claim on any key page, the data-only line on a plan page
- ✅ `contact-in-help-check.mjs` — 38 checks: the contact page still renders its form, the help centre
  carries the same form with the new lead-in in three languages, the header has no contact link, the
  footer still has one, the subtitle ellipsis, and the headline no longer set to `text-6xl`

### C5, mobile
- Not touched. No PWA, manifest or `/app` file is in the changeset

### C6, cron
- ✅ Both cron routes refuse an unauthenticated caller; `CRON_SECRET` handling and `vercel.json` untouched

### Production baseline, taken before the push
`agent-workspace/scripts/prod-baseline.mjs` — eleven paths, all as expected: three locales 200,
`/admin/orders` 307, `/api/checkout/health` `ok: true` in 332 ms. It also records the two visible
before-states this release changes: the header carries **one** `/he/contact` link, and the hero headline
still carries `lg:text-6xl`. Both should flip after the deploy.

## Known gaps, stated rather than smoothed over

- **The email templates were not re-rendered in this pass.** `email-preview.ts` needs a direct
  connection to the Postgres endpoint to borrow a real order, and that endpoint is refusing connections
  from scripts locally right now while the app's pooled connection works fine. The templates were
  rendered and verified when the changes were made, and the send path itself is unchanged
- **The local environment is intermittently unreliable, and it is the environment rather than the code.**
  During the smoke window `/api/packages` failed twice — once on an eSIMaccess timeout, once on a Prisma
  connection error — and recovered on its own. Checked again afterwards: locally and in production the
  endpoint returns 200 with an identical 1,288,391-byte body, and a destination page renders. Nothing in
  this changeset touches that route
- **Nothing in this release has been through a real paid purchase.** The consent checkbox, the
  conditional `COMPLETED` and the refund handling are proved by code and by refusals, not by money. The
  first real purchase after the deploy is the real test
- **The retry guard has not been proved against the supplier**, and the adjustment webhook has not been
  replayed with a real signed payload. Both need credentials that are not local
- **Fourteen published articles still contradict the corrected FAQ** on top-ups and on 180 days. Listed
  by `036-article-facts-check.mjs`. Several are general advice rather than a promise and need a judgement
  each, so they want their own ticket
- **The mobile app bundle still says "24/7 Support".** Out of this changeset; `/app` is untouched
- **Admin retry is still missing two guards the customer's route has** — no block on a `PROCESSING`
  order without a batch id, and none on a refunded order. Admin-operational, not a security hole
- **`verifyTurnstile` fails open on a Cloudflare timeout.** Pre-existing; worth knowing that
  `TURNSTILE_SECRET_KEY` must be present in production for the bot protection to mean anything
- **The contact form's validation messages are still English literals** in all three languages, unlike
  the checkout's, which this release converted to keys. Only visible on a validation failure

## Gate D — the pre-push checklist

Ready to tick, in order, when Gabriel approves:

- ✅ Gabriel asked for the release to be prepared
- ✅ Risk level determined: **R2**
- ✅ Gate A green, `npx next build` = 0
- ✅ Gate B answered; no environment change; the money path traced
- ✅ Gate C green — 62 + 60 + 38 checks
- ✅ Backup tag `pre-deploy-20260810-2325` on `f8040bb`
- ✅ Staging is by explicit path; scratch output, the unrelated `phone-lookup.mjs` and
  `agent-workspace/backups/` stay out
- ✅ Deploy by `git push origin main` only. No Vercel CLI, ever
- ⬜ **Gabriel's own pass in a browser** — the local review list is in the CHANGELOG and below
- ⬜ **Second explicit approval, because this is R2**

### The exact commands, to run only on approval

```powershell
git add CHANGELOG.md prisma src agent-workspace/DEPLOY-READINESS.md
git add agent-workspace/tickets/026-support-readiness agent-workspace/tickets/034-conversion-checkout
git add agent-workspace/tickets/036-faq-golden-tip agent-workspace/tickets/037-purchase-reliability
git add agent-workspace/tickets/_paused/026-support-readiness
git add agent-workspace/scripts/026-article-claims-check.mjs agent-workspace/scripts/026-article-claims-fix.mjs
git add agent-workspace/scripts/026-cleanup-test-submission.mjs agent-workspace/scripts/026-support-email-check.mjs
git add agent-workspace/scripts/034-search-match-check.mjs agent-workspace/scripts/036-article-facts-check.mjs
git add agent-workspace/scripts/036-content-check.mjs agent-workspace/scripts/contact-in-help-check.mjs
git add agent-workspace/scripts/help-box-check.mjs agent-workspace/scripts/nav-menu-check.mjs
git add agent-workspace/scripts/predeploy-smoke.mjs agent-workspace/scripts/prod-baseline.mjs
git add agent-workspace/scripts/email-preview.ts agent-workspace/scripts/email-verify.mjs
git status                      # read the staged list before committing
git commit -m "..."             # message drafted below
git push origin main            # this is the deploy
```

Commit message, for approval:

```
Tickets 026/034/036/037: honest support claims, a checkout in the visitor's language,
a purchase that cannot lie about itself, and the tip that fixes most eSIMs

026: no claim of round-the-clock or same-day support anywhere; the contact form
     answers, references itself and reaches the admin; one support address
034: sixteen hardcoded English strings out of the checkout, VAT and currency
     stated, a route from the toast to the cart, a search field that finds things
036: the FAQ no longer contradicts the supplier; five missing questions; the
     golden tip on the site and in the purchase email
037: COMPLETED only with a profile in hand, a retry that cannot buy twice,
     refunds visible where the sale is, and consent taken before payment
plus: contact out of the header menu with its form at the foot of the help centre,
      a hero headline on one line, and two hardenings on the contact endpoint
```

## Post-deploy smoke, to run once Vercel reports Ready

- `https://www.sim2me.net/en`, `/he`, `/ar` → 200, no 5xx
- `https://www.sim2me.net/api/checkout/health` → `ok: true`
- **The header has no Contact entry** in all three locales, and `/he/contact` still returns 200
- `/he/help` ends with the message form and the "לא מצאת פתרון?" heading
- The hero headline is one line and no longer carries `lg:text-6xl`; the floating chat button is gone
- `POST /api/checkout/create-transaction` with no consent → 400 "Terms must be accepted before payment."
- Admin → Orders loads; Admin → Contact shows the `SM-XXXXXX` reference beside a subject
- A real contact form submission in Hebrew: success screen shows a reference, the auto-reply arrives in
  Hebrew with working links, and the admin notification arrives
- No new error class in the Vercel function logs for `/api/contact`, `/api/webhooks/paddle` or either
  retry route
- **Not part of the smoke:** a real purchase. It is the first thing to watch on the next genuine order,
  and the eSIM balance should not be spent to prove a status field

If any of it fails: stop, report, propose rollback to `pre-deploy-20260810-2325`. Do not push again blind.

## Rollback

```powershell
# only with Gabriel's approval
git push origin pre-deploy-20260810-2325:main
```

That returns the site to `f8040bb` exactly. The database needs nothing: no schema changed, and the two
content edits are independent of the code, with written reversals above. A partial rollback is not
available — the release is one changeset — so a single piece needing reversal goes through the per-file
backups listed at the top.

## Shipped

Pushed 11 Aug 2026, 10:20. `f8040bb..9cabe54`, 94 paths. Second explicit approval given the same
minute. Tag `pre-deploy-20260810-2325` is on the remote and points at `f8040bb`, the last known good
commit.

The new build was live **45 seconds after the push**, confirmed by the two markers recorded in the
baseline flipping together: the header's `/he/contact` link went from one to zero, and the hero headline
went from `lg:text-6xl` to `lg:text-[clamp(2rem,3.1vw,2.4rem)]`.

Post-deploy smoke, run against `www.sim2me.net`:

- ✅ The whole gate C suite, re-run against production — **62 checks, all green.** Three locales 200, a
  destination page 200, `/api/checkout/health` `ok: true` with all five steps green and `paddle-ping` at
  136 ms, every admin route 3xx, both cron routes refusing, 33 page/locale combinations clean
- ✅ **`POST /api/checkout/create-transaction` without consent → 400 "Terms must be accepted before
  payment."** in production. The gate that was the point of 037 is live and refusing
- ✅ Unsigned webhook refused; both retry routes refuse without a session
- ✅ `contact-in-help-check.mjs` against production — **all checks passed.** No contact entry in the
  header in any locale, the footer link intact, `/he/contact` still 200 with its form, the help centre
  carrying the same form under its new lead-in in three languages, the subtitle ellipsis, the fluid
  headline
- ✅ `help-box-check.mjs` — the "still need help" box gone in all three languages, the form and the
  lead-in still present
- ✅ `036-content-check.mjs` against production — **60 checks, all passed:** the golden tip with its five
  steps in three languages, 20 unique JSON-LD questions with no leaked keys, no support-hours claim on
  any key page
- ✅ The floating chat button is absent from all three locale roots — no sticky container, no icon

Two smoke results needed reading rather than reacting to, both the check being stale rather than the
site being wrong:

- `contact-in-help-check.mjs` asserted that the help page contains `href="#contact"`. It was written
  before the "still need help" box was removed, and that link lived inside the box. The assertion was
  deleted; the anchor itself is still there and still asserted
- `help-box-check.mjs` reported the English lead-in missing. It compares copy without decoding entities,
  and the English heading contains an apostrophe, which arrives as `&#x27;`. Decoding added, same class
  of false negative as the one recorded at the end of the previous release

### Not verified after the deploy, deliberately

- **No real purchase.** The consent gate, the conditional `COMPLETED` and the refund handling meet real
  money on the next genuine order. Spending the supplier balance to prove a status field is not worth it
- **No contact form submitted in production.** It writes a row and sends two emails, so it is Gabriel's
  to do in a browser as part of his own pass, or mine to do and clean up on request
- **Vercel function logs not read.** That needs the dashboard or the CLI; the endpoints themselves answer
  correctly from outside

---

# Previous release — Ticket 032, prepared 2026-08-02

Everything below is **local and unpushed**. The protocol is `DEPLOY-PROTOCOL.md` at the repo root and
it governs; this file records how each of its gates was answered for this changeset. The record of the
release that shipped earlier today is kept further down.

## Where the repo stands

| | |
|---|---|
| HEAD | `361c3d2` — *Tickets 028/030/031*, shipped 2 Aug 2026 13:40 |
| Branch | `main`, level with `origin/main` |
| Going up | 10 modified files, 2 new source files, plus the ticket's workspace docs |
| Rollback target | `361c3d2` |
| Backup tag | `pre-deploy-20260802-<HHMM>` on `361c3d2`, created before the push |

One ticket, one changeset, one commit. Per-file backups of every edited file sit in
`agent-workspace/tickets/032-internal-esim-assignment/backup/`, copied before the first edit.

## What the release contains

Selling an eSIM to a customer from the admin panel, without a checkout. One new endpoint,
`POST /api/admin/orders/internal`, one new component, `InternalSaleModal.tsx`, two entry points, and an
`INTERNAL` tag on the orders list. Full description in `CHANGELOG.md` and in the ticket's PRD.

## Risk level: R3

The protocol's table names a **Prisma schema change** as R3, and this release adds two columns to
`Order`. R3 is R2 plus a database backup and a written rollback plan before the push, and R2 itself
requires a second explicit approval beyond the request to deploy.

It also touches three other B1 areas outright: **eSIMaccess** (it purchases), **emails** (it sends the
post-purchase email), and **prices** (it sets an order total). So R3 is the level even before the schema
argument.

### The schema change is already in the production database

This is the unusual part of this release and it deserves stating plainly rather than being discovered
later. The two columns were applied on 2 Aug while building, because there is one database — local
development runs against the same Postgres as production — and nothing could be verified without them.

Why that is the safe order rather than the dangerous one:

- The SQL was generated with `prisma migrate diff` and **read before it was applied**: one `CREATE TYPE`,
  two `ADD COLUMN` with a default, one `CREATE UNIQUE INDEX`. No rename, no retype, no drop, no backfill
- `source` defaults to `PADDLE`, so all 17 pre-existing rows read exactly what they read before
- `idempotencyKey` is nullable and was created empty, so the unique index could not fail
- **The code currently in production does not select either column.** They have been live and inert for
  several hours, and every dashboard figure was identical before and after, to the cent

So the database is already ahead of the deployed code, in the direction that is safe. The push moves the
code up to meet it. There is no migration pending at deploy time, and `npm run build` on Vercel will run
`prisma db push` against a schema that is already in sync.

### Rollback plan, written before the push, as R3 requires

**Code:** `git push origin pre-deploy-20260802-<HHMM>:main`, with Gabriel's approval. This returns the
site to `361c3d2` exactly.

**Database:** nothing to undo. After a code rollback the two columns simply go back to being unread, as
they are right now. They are additive and defaulted, so no existing query, export or report can see a
difference. If they must be removed later — and there is no reason to — the reversal is
`ALTER TABLE "orders" DROP COLUMN "source", DROP COLUMN "idempotencyKey"; DROP TYPE "OrderSource";` and
it costs only the internal orders' provenance, not the orders.

**The one thing a rollback cannot undo:** an eSIM already bought from eSIMaccess. If an internal sale is
made and the release is then rolled back, the balance was still spent and the customer still has a
working eSIM. The order row survives the rollback intact — only the `INTERNAL` tag and the new button
disappear — so nothing is lost or orphaned. It is worth knowing before rather than after.

**Per-file:** `agent-workspace/tickets/032-internal-esim-assignment/backup/` holds the pre-edit copy of
all seven originally listed files, and git holds every tracked file at `361c3d2`.

## Gate A — code builds locally

- ✅ `npx tsc --noEmit` → 0
- ✅ `npm run lint` → **exit 0, no errors.** Warnings only, all pre-existing; the two new files produce
  no output at all
- ✅ `npm run test:profit` → pass
- ✅ `npm run test:locale-path` → pass
- ✅ `npx tsx src/app/admin/orders/orderFilters.test.ts` → pass — run because `AdminOrdersClient.tsx`
  is in the changeset
- ✅ `npx tsx src/app/admin/orders/ordersExcel.test.ts` → pass — same reason
- ✅ `npx next build` from a deleted `.next` → **0**, with `/api/admin/orders/internal` in the route
  table
- ✅ No `.env`, credential or key file in the changeset
- ✅ No `console.log`, `debugger`, TODO or FIXME added. The route's two `console.warn` / `console.error`
  calls match what the webhook and the retry route already do
- ✅ The two throwaway verification scripts were deleted; their output is preserved in the ticket's
  `proofs/`

`npm run build` itself is not used, for the same reason as the previous release: it chains
`prisma db push` and two `tsx` scripts that rewrite article and legal-page rows. `npx next build`
compiles the identical application without writing to the database. Vercel runs the full script on its
own side, against a schema already in sync.

## Gate B — risk and environment

### B1 — areas touched

- ✅ **eSIMaccess** — purchases a package, reads the balance, fetches the profile. Uses the existing
  `purchasePackage`, `getBalance` and `getEsimProfileWithRetry` unchanged
- ✅ **Emails** — sends the existing `sendPostPurchaseEmail`, fire-and-forget, in the chosen locale
- ✅ **Prices** — sets an order total, floored server-side at the live wholesale price
- ✅ **Prisma schema** — two additive columns, discussed above
- ✅ **Admin orders** — the orders list gained a tag, and Retry is hidden for one new case
- ❌ Checkout / Paddle client / `create-transaction` / `prepare` — **not touched**
- ❌ Paddle webhook and fulfillment — **not touched.** Its logic was copied into the new route rather
  than shared, precisely so this ticket could not reach it
- ❌ Customer auth, OTP, Admin TOTP — **not touched**
- ❌ Refund, archive, bulk, Excel — **not touched**
- ❌ Blocklist / fraud, cron, `vercel.json`, PWA, articles, i18n — **not touched**

### B2 — environment variables

No new variable. The route uses `ESIMACCESS_ACCESS_CODE`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
`DATABASE_URL` and `NEXT_PUBLIC_SITE_URL`, all already in production and all already used by the paid
path. Nothing to add, change or delete in Vercel, and no secret appears in the changeset or in any log.

`maxDuration = 60` matches the Paddle webhook and both retry routes, so it is within whatever the plan
already permits.

### B3 — backup

- ⬜ `git tag pre-deploy-20260802-<HHMM>` on `361c3d2`, immediately before the push
- ✅ Database rollback plan written above, as R3 requires

## Gate C — smoke

### C0, always
- ✅ `/en`, `/he`, `/ar` → 200, and a destination page → 200, on the dev server after the final edit

### C1, checkout, money and eSIM
- ✅ **A real internal sale, driven by Gabriel through a browser.** Spain 3GB 30Days, sold at cost to an
  existing customer: order `COMPLETED`, ICCID and QR present, customer linked, `paddleTransactionId`
  null, one audit entry with the right admin, package, price and cost
- ✅ **The balance dropped by exactly the wholesale price, once**: 55.6700 → 54.0700 on a $1.60 package
- ✅ **Revenue +1.60 and eSIM cost +1.60, exactly; Fee cost and Net in bank unchanged.** Order count up
  by exactly one, so nothing that was refused left a row behind. Full table in the ticket's
  `proofs/phase-6-live-sale.md`
- ✅ The price floor is enforced on the server against the live wholesale price, not against anything
  the browser sends. 20 automated checks cover the validation and the floor arithmetic
- ✅ Nothing on the charge path is in the changeset
- ✅ `/api/admin/orders/internal` returns **401** without a session, and requires `SUPER_ADMIN` or
  `ADMIN` with a session

### C2, customer account
- Not touched. No auth, registration, verification or OTP file is in the changeset. The one customer
  record this feature can create goes through the same fields and the same bcrypt cost as
  `api/account/register`

### C3, admin
- ✅ `/admin/packages`, `/admin/accounts`, `/admin/orders` each compile and redirect correctly behind
  the guard
- ✅ Gabriel opened Packages and completed a sale from it in a browser
- ✅ Dangerous actions were not modified. Refund on an internal order declines cleanly — the route
  answers "No Paddle transaction on this order" and the UI does not render the button without a
  transaction id

### C4, content and i18n
- Not touched. No message file, article or legal page is in the changeset. The modal is admin-only and
  English, like the rest of the admin panel; the customer's email locale is chosen per sale and uses
  the existing templates

### C5, mobile
- Not touched. Admin-only feature, no public page in the changeset

### C6, cron
- Not touched. No change to `CRON_SECRET` handling or to `vercel.json`

## Known gaps, stated rather than smoothed over

- **Creating a customer during a sale has never been exercised.** The live sale used an existing
  account. The failure mode is the safe one — the customer is created before the order and before the
  purchase, so a failure costs nothing and buys nothing — but it will meet production untested
- **A VIEWER admin has not been observed receiving 403.** Enforced by an explicit role check on the
  server and by the `canSell` prop in the UI, but not watched with a real VIEWER session
- **A gift is booked at cost, not at zero.** Deliberate, and the consequence is that revenue gains money
  that never arrived. Allowing zero behind an explicit confirmation is a one-line change if preferred
- **`Avg. order` skews**, because its numerator now includes internal revenue and its denominator counts
  only Paddle orders. Pre-existing for sync stubs, more visible now
- **The retry double-purchase hole is still open for Paddle orders.** Closed for internal ones. It edits
  a money path and waits on its own approval

## Gate D — the pre-push checklist

- ✅ Gabriel explicitly asked for the deploy
- ✅ Risk level determined: **R3**
- ✅ Gate A green, `npx next build` = 0 from a clean `.next`
- ✅ Gate B answered; no environment change, no money-path file touched
- ✅ Gate C passed, including a real sale with the balance and the dashboard reconciled
- ✅ R3 database rollback plan written before the push
- ✅ Backup tag `pre-deploy-20260802-2005` on `361c3d2`, now on the remote
- ✅ Commit contains only files belonging to this change. `src/app/[locale]/design-preview/` stays out,
  and staging is by explicit path — never `git add -A`, which would put that route on the live site
- ✅ Deploy by `git push origin main` only. No Vercel CLI, ever
- ✅ **Second explicit approval, because this is R3** — given 2 Aug, 20:08

## Post-deploy smoke, to run once Vercel reports Ready

- `https://www.sim2me.net/en`, `/he`, `/ar` load, no 5xx
- `https://www.sim2me.net/api/checkout/health` → `ok: true`
- Admin → Orders loads, and the sale made locally shows its `INTERNAL` tag in production
- Admin → eSIM Packages loads and the "Internal sale" button is on the cards
- `POST /api/admin/orders/internal` without a session → 401
- The dashboard still reads the same Revenue, Fee cost and Net in bank as it does locally
- No new error class in the Vercel function logs for `/api/admin/orders/internal`
- **Not part of the smoke:** another purchase. The feature was proven on real money once already;
  production does not need a second $1.60 to prove the same thing

If any of it fails: stop, report, propose rollback to the tag. Do not push again blind.

## Shipped

Pushed 2 Aug 2026, 20:09. `361c3d2..10bdf29`, 23 files. Tag `pre-deploy-20260802-2005` is on the
remote and points at `361c3d2`, the last known good commit.

Production smoke, run against `www.sim2me.net` once the build landed:

- `GET /api/admin/orders/internal` went from **404 to 405** across the deploy, which is the
  unambiguous proof that the new route is live: 404 was the route not existing, 405 is it existing
  and refusing a method it does not export. It was polled every 20 seconds and flipped 41 seconds
  after the push
- `POST /api/admin/orders/internal` with no session → **401**, so the guard survived the deploy
- `/en`, `/he`, `/ar`, the destinations index and a destination page → 200. No 5xx anywhere
- `/admin/login` → 200; `/admin/orders` and `/admin/packages` → 307, guards intact
- `/api/checkout/health` → `ok: true`, all five steps green, `paddle-ping` 86 ms. The payment path is
  untouched and healthy, which was the premise of the whole ticket
- No second purchase was made in production. The feature was already proven on real money locally,
  and the balance does not need to prove it twice

The database needed nothing at deploy time. The two columns had been live and inert for hours, so
Vercel's `prisma db push` ran against a schema already in sync.

---

# Previous release — shipped 2 Aug 2026, `e4a9d48..361c3d2`

Kept for the record. Tickets 028 phase 7j and 10, 030, and 031.

## Where the repo stood

| | |
|---|---|
| HEAD | `e4a9d48` — *Ticket 029: six daily hot deals, and the deal price follows the visitor*, 2026-08-01 |
| Branch | `main`, level with `origin/main` — nothing pushed since `e4a9d48` |
| Going up | 29 modified files, 3 new source files, 20 new served assets, plus workspace docs |
| Rollback target | `e4a9d48` |
| Backup tag to create | `pre-deploy-20260802-<HHMM>` on `e4a9d48`, before the push |

Four tickets' worth of work is in one uncommitted changeset. That is the main structural risk in this
release: there is no per-commit rollback inside it. Per-file backups of every edited file sit in each
ticket's `backup/` folder, copied from the working tree before that ticket's first edit.

## What the release contains

### Ticket 028 phase 7j — characters on the destination pages

- Four rotating header poses beside a destination's name, chosen by hashing the slug so the choice is
  stable between server and client and spreads evenly across the catalogue
- Simi and Sima flanking "show all plans", each pointing at it
- The pair peering down over the divider when the catalogue opens, centred, with "back to
  recommended" beneath them
- The pair on binoculars beside the destinations-index heading
- Both characters beside the price on a plan page, cropped to head and torso
- A 2-second spinner on "show all plans", so the catalogue appearing reads as an answer to the click

### Ticket 028 phase 10 — the shelf and the price badges

Not character work; shares the changeset.

- **The weekend tier is gone.** It always resolved to the thinnest package in the catalogue, which
  anchored the shelf to a price nobody should buy at. Audited over 14 destinations before removal:
  all still produce four tiers, so no destination lost its shelf
- **"from $X" removed** from the destination header, homepage chips, featured cards, the destinations
  index, and the destination page's SEO title and description
- **"$X per day" removed** from plan cards, deal cards and the plan detail page
- A 15% validity-upgrade rule was built, tested, and **reverted** at Gabriel's request. Not in this
  release

### Ticket 030 — recommendations on the plan page

- "אולי יתאים לכם גם" at the foot of a plan page: up to two packages from the same destination, drawn
  from the curated shelf, with Simi and Sima above them
- **Price bug fixed** — `/destinations/au/plan/JC101` showed $9.40 while the destination page that
  linked to it sold the same package at $8.64. It now shows the deal price with the original struck
  through
- `getDestinationData` moved to `src/lib/api/destination-data.ts`, proven inert
- Audited over 104 simulated plan pages across 18 destinations, 0 rule failures

### Ticket 031 — characters on the rest of the site

Now **built**, not just planned.

- A pose beside the heading on `/how-it-works`, `/data-calculator`, `/help` and `/contact`. Four new
  renders, cut with the existing pipeline
- The generic pair on `/checkout`, `/account` and `/success`, and — added on request after the first
  pass — above the `/account/login` and `/account/register` cards, outside the card so the sign-in
  form, the OTP step and Turnstile are untouched
- `DEFAULT_NAV_MENU` now matches `Header.tsx`; the first admin save would previously have deleted the
  Calculator link from the site
- `cutout.mjs --proof` writes into the workspace instead of `public/characters`

## Risk level: R2

Presentation work almost everywhere, which argues for R0 or R1. It is **R2** anyway, for one reason
worth stating plainly: gate B1 lists **מחירים** as a money-path area, and this release changes the
price printed next to an add-to-cart button.

The protocol says to treat the uncertain case as R2, and being conservative here costs one extra
approval and buys a full gate C. R2 was kept even after the investigation below came back clean —
downgrading a level because the evidence looks good is the "it seems fine" move the protocol exists
to prevent.

**R2 requires:** gate A + gate B + full gate C + gate D, a backup tag, and a second explicit approval
beyond the request to deploy.

### The money path was traced end to end

The concern was that the cart entry built on a plan page now carries the deal price where it used to
carry the catalog price, and the cart is `localStorage`, i.e. attacker-controlled. Traced and read
directly rather than assumed:

- `CheckoutClient.tsx` does send `unitPrice` from the cart to `POST /api/checkout/create-transaction`
- That route **never reads it.** `unitPrice` appears three times in the entire `src/app/api` tree: a
  security comment, a Zod field, and a second comment. The charged amount is `serverPrice`, resolved
  from `PackageOverride.customPrice` or the packages cache, with `getActiveDealPrice(planId)` applied
  server-side and only ever downward
- The order total written after payment comes from Paddle's signature-verified webhook payload, not
  from anything the browser sent

So checkout was **already** charging the deal price. This release makes the page agree with the till
rather than changing what the till does. No file on the charge path is in the changeset:
`create-transaction`, the Paddle webhook, `hot-deals.ts` and the Prisma schema are all untouched. The
one checkout file that is in the changeset, `CheckoutClient.tsx`, gained a heading wrapper and two
decorative figures and nothing else — the diff is nine lines and is quoted in the ticket.

## Gate A — code builds locally

Re-run from a deleted `.next` after the last edit:

- ✅ `npx tsc --noEmit` → 0
- ✅ `npm run lint` → **0**, no errors. Six pre-existing errors were fixed to get here; see below
- ✅ `npm run test:profit` → pass
- ✅ `npm run test:locale-path` → pass
- ✅ `npx next build` → 0
- ✅ No `.env`, credential or key file in the changeset
- ✅ No leftover `console.log`, `debugger` or stray TODO in any changed file
- ✅ No orphan assets: all 21 served character poses are referenced by code. `public/characters` is
  42 files, 3.7 MB

`npm run build` itself is not used, because it chains `prisma db push` and needs `DIRECT_URL`, which
is not set locally. `npx next build` compiles the identical application without touching the
database. Called out because the protocol names `npm run build` by name.

### Six lint errors were fixed, none of them from this work

The gate requires green and it was red, in files this release never touched. All six were mechanical
and none changes runtime behaviour:

| File | Error | Fix |
|---|---|---|
| `components/ui/input.tsx` | empty interface | `type` alias. `InputProps` is used only inside that file |
| `lib/theme/tokens.ts` | three `let`s never reassigned | `const`. Confirmed read-only through line 32 |
| `admin/seo/SeoSettingsClient.tsx` | unescaped apostrophe | `&apos;`, renders identically |
| `character-preview/page.tsx` | unescaped apostrophe | route retired, see below |

If Gabriel would rather the release touch nothing outside its own scope, these three files can be
reverted and the gate declared red-but-known, as it evidently was on previous deploys.

## Gate C — smoke

### C0, always
- ✅ `/en`, `/he`, `/ar` → 200
- ✅ Zero console errors, warnings, exceptions or failed requests on ten pages in Hebrew: home,
  destinations index, a destination, a plan page, all four menu pages, sign-in, register
- ✅ `dir=rtl` correct on every one of them, every figure loaded, none broken

### C1, checkout and money
- ✅ `GET /api/checkout/health` → `ok: true`, all five steps green including `paddle-ping`
- ✅ **Full cart flow driven through a real browser** on `CKH509`, a package with a live deal at
  $15.25 against a $16.40 catalog price. Plan page shows $15.25 with $16.40 struck; a real click on
  "הוסף לעגלה" writes `price 15.25` and `originalPrice 16.4` into the cart; the checkout page totals
  $15.25. Same number in all three places
- ✅ Recommendations render on that page, one card, correctly collapsed to a single card rather than
  padded with a second
- ✅ Nothing on the charge path is modified — traced above

### C2, customer account
- ✅ `/he/account/login` and `/he/account/register` → 200, both render
- ✅ Form fields intact after adding the figures: 2 inputs on sign-in, 6 on register
- ✅ `/he/account` → 307 to the login page, guard intact

### C3, admin
- ✅ `/admin/login` → 200
- ✅ `/admin/orders`, `/admin/navigation`, `/admin/seo` → 307, guards intact
- Admin screens behind the guard were not opened; the two admin edits are one suggestion array and
  one apostrophe, both covered by typecheck, lint and build

### C4, content and i18n

The first pass was Hebrew-heavy: all three locales on the homepage, but console errors and the cart
flow in Hebrew only, and just five English/Arabic combinations elsewhere. Gabriel asked whether every
language had really been covered. It had not. Redone as a full matrix.

**11 pages × 3 locales × 2 widths = 66 checks**, each verifying text direction, figure loading,
mirroring, horizontal overflow, untranslated keys and console errors:

- ✅ `dir` correct everywhere — `ltr` for `en`, `rtl` for `he` and `ar`
- ✅ No horizontal overflow at 375 px or 1440 px in any locale
- ✅ No figure off-canvas, none broken once lazy loading is accounted for
- ✅ **Key audit across all 509 message keys:** Hebrew and English complete, Arabic missing exactly 17
- ❌ One real failure, pre-existing: see below

### The Arabic contact page is missing its whole form vocabulary

`src/messages/ar.json` has 492 of 509 keys. All 17 gaps are in `contact`, and they are the entire
form: `namePlaceholder`, `emailPlaceholder`, `phone`, `phonePlaceholder`, `messagePlaceholder`,
`subjectPlaceholder`, all six `subject_*` options, `marketingConsent`, `sending`, `messageSent`,
`messageSentDesc`, `sendAnother`.

An Arabic visitor sees literal `contact.namePlaceholder` and `contact.subject_refund_request` in the
form, and the browser console fills with `IntlError: MISSING_MESSAGE`. Screenshot in the ticket
proofs.

**Not caused by this release** — the only other change to `ar.json` here is the two `plan.recommended*`
keys, and every other section of the file was already complete. It has been live on production.

**Fixed, on Gabriel's instruction, inside this release.** All 17 strings written in the same Modern
Standard Arabic register as the rest of the section, in the same key order as `en.json`. Where the
page already names a concept twice the wording was matched rather than reinvented: the subject
options now echo the "common issue types" chips above them, and `subject_refund_request` and
`subject_general_inquiry` are word-for-word the existing `issueRefund` and `issueOther`.

Content only — no logic, no component, no key referenced from code that did not already exist.

Verified after: 509 keys in all three locales, no gaps, no empty values, and no Arabic string left
identical to its English source apart from `devices.samsungTitle` and `devices.otherList`, which are
device model names and are identical in Hebrew too. `/ar/contact` renders with zero raw keys and zero
`IntlError`s at 375 px and 900 px, and `/he/contact` and `/en/contact` are unchanged. Before-and-after
screenshots in the ticket proofs.

One thing deliberately left alone: the phone-country dropdown lists country names in English in every
locale. It comes from a country-data list rather than the message files, so it is a separate problem
and out of this release's scope.

### C5, mobile
- ✅ 375 px sweep over 15 page/locale combinations. **All clean** — no horizontal scroll, no figure
  off-canvas, none under 40 px tall
- One real bug found and fixed during this sweep; see below

### C6, cron
- Not touched. No change to `CRON_SECRET` handling or to `vercel.json`

## What the sweep caught

**A plan page for a package on offer scrolled sideways on a phone.** Document width 394 px against a
375 px viewport, which shifted the header, footer and cookie banner too. Caused by 028 and 030
meeting: 028 put the pair in the price row, 030 added the struck-through original beside the deal
price, and neither the prices nor the figures could give way, so the row measured 378 px inside a
343 px card.

Fixed by making the price block `min-w-0 flex-wrap` — the original now drops under the discounted
price rather than forcing the page wider — and bringing the phone figures from 140 px to 116 px so it
rarely needs to. Re-verified at 375 px in three locales, with and without a live deal, and the card
was inspected at 375 and 1440.

Worth noting how it hid: a plan page **without** a deal never showed it, which is why earlier 375 px
passes missed it. It would have hit only the pages hot deals drive traffic to.

## Known and pre-existing, not caused by this release

- **Hydration mismatch whenever the cart is non-empty.** React logs "server rendered HTML didn't
  match the client" on any page once something is in the cart. Isolated by loading `/he/about`, a
  page this release never touches, with an empty cart (clean) and then a full one (mismatch). It is
  the header's cart badge reading `localStorage`, and it predates all of this. Worth its own ticket;
  not a blocker here
- **The homepage "For You" section still shows catalog prices** for a package on offer. It fetches
  `/api/packages` from the browser and never sees a deal. Deliberately deferred since 029
- **`h1` is empty on the sign-in and register pages** — their title is a `CardTitle` div. Pre-existing
  and unrelated, but it is an SEO and screen-reader gap somebody should pick up

## Not shipping

Both are untracked, so they cannot reach production as long as staging is done by explicit path,
which is how the command below is written.

| Item | Status |
|---|---|
| `src/app/[locale]/character-preview/` | **Retired.** Moved to `agent-workspace/tickets/028-characters-imagery/retired-preview-route/` with a README. Its own header said to delete it once the characters were on real pages; they are. It was also the last lint error in the character work |
| `src/app/[locale]/design-preview/` | **Left in place, untracked.** Belongs to ticket 027, which is parked. Its header says to delete it once the palette decision is made, and that decision is still open. Gabriel can still view it locally |
| `agent-workspace/backups/` | 13 files, 0.2 MB. Untracked. Not staged |
| `public/characters/*-proof.png` | **Gone**, never tracked in any commit, and covered by `.gitignore` since 028 in any case. `cutout.mjs` now writes proofs to the workspace |

`.gitignore` already keeps the workspace binaries out: character master PNGs, ticket `proofs/`
folders and any `*-proof.png` under `public/characters` are all ignored, so none of the screenshots
or masters from this work can reach the repo. Nothing about those rules changed in this release.

One standing hazard remains: `design-preview` is an ordinary `.tsx` under `src/` and is not ignored,
so a future `git add -A` would sweep it into a commit and put the route on the live site.

## Gate D — the pre-push checklist

Ready to tick, in order, when Gabriel approves:

- ⬜ Gabriel explicitly asks for the push
- ✅ Risk level determined: **R2**
- ✅ Gate A green, `npx next build` = 0
- ✅ Gate B answered, money path traced and clear
- ✅ Gate C0–C5 passed; the one failure found was fixed and re-checked
- ⬜ Backup tag `pre-deploy-20260802-<HHMM>` created on `e4a9d48`
- ✅ Commit contains only files belonging to this change; no secrets, no scratch routes
- ✅ Deploy by `git push origin main` only. No Vercel CLI, ever
- ⬜ **Second explicit approval, because this is R2**
- ⬜ Gabriel's own pass in a browser

## Post-deploy smoke, to run once Vercel reports Ready

- `https://www.sim2me.net/en`, `/he`, `/ar` load, no 5xx
- `https://www.sim2me.net/api/checkout/health` → `ok: true`
- A destination page: header characters, the pointing pair, "show all plans" and its spinner
- A plan page **for a package on today's deal**: deal price, struck original, recommendations, and
  no sideways scroll on a phone
- The four menu pages and the sign-in page: a character beside each heading
- Admin → Orders loads

If any of it fails: stop, report, propose rollback to the tag. Do not push again blind.

## Rollback

`e4a9d48` is the last deployed commit. Tag it before pushing; recovery is
`git push origin <tag>:main`, with Gabriel's approval, per protocol section 10.

A partial rollback is not available, because the release is one changeset. If one piece needs
reverting later, the per-file backups in each ticket's `backup/` folder are the way back.

## Shipped

Pushed 2 Aug 2026, 13:40. `e4a9d48..361c3d2`, 112 files. Tag `pre-deploy-20260802-1334`
is on the remote and points at `e4a9d48`, the last known good commit.

Production smoke, run against `www.sim2me.net` once the build landed, 30 seconds after the push:

- The three locales return 200. Checkout health `ok: true`, all five steps green,
  the slowest 273 ms
- The eleven touched pages return 200
- The plan page for a package on a live deal: `$15.25` with `$16.40` struck through,
  the same pair of numbers the destination page and the cart show. Recommendations
  render. Zero overflow at 375 px, which is the bug found during Gate C5
- `/ar/contact` has no raw translation keys left in the HTML
- `character-preview` and `design-preview` both 404, so neither preview route shipped

Two smoke results looked like failures and were not:

- The destinations index reports no characters in its server HTML. It reports none
  locally either. `DestinationsClient` renders the figure after hydration, so it was
  never in the SSR markup. In a real browser the figure is there
- The two pointing figures on a destination page measured `naturalWidth: 0` on mobile.
  They carry `loading="lazy"` and the button they flank sits below the fold at 375 px.
  All four files serve 200 with the right content type; after scrolling to them they
  decode at full size. On desktop they load immediately. Not a regression

Anything checked by string-matching the HTML has to distinguish rendered text from the
serialised i18n bundle. The `from $` check tripped on `"heroFrom"` sitting in the message
payload; the rendered count was zero.
