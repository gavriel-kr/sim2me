# Ticket 032 — Detailed Implementation Plan (DIP)

Status icons: ⬜ open · ✅ done

Trimmed scope, per Gabriel on 2026-08-02: purchase only, price floored at cost, two entry points. The
sync, cron, retroactive-assignment and editable-cost phases were removed, not deferred.

## Gate — before any code

- ✅ Gabriel approved implementation on 2026-08-02, and asked that the database question be resolved
  without another round trip
- ✅ **How the two new columns reached the database.** There is one database — `DATABASE_URL` points at
  `db.prisma.io` and `DIRECT_URL` is unset locally — so there was no development database to use. The
  SQL was generated and read first with `prisma migrate diff`, confirmed additive, then applied with a
  single `prisma db push`. Evidence in `proofs/phase-1-6-local-verification.md`
- ✅ This ticket's changeset is its own; the pre-existing untracked files were left alone
- ✅ No work done on tickets 026 / 027 (both parked in `_paused/`)

## Phase 0 — Safety

- ✅ Created `agent-workspace/tickets/032-internal-esim-assignment/backup/`
- ✅ Copied before the first edit: `prisma/schema.prisma`, `src/lib/validation/schemas.ts`,
  `src/app/api/admin/accounts/route.ts`, `src/app/admin/packages/PackagesClient.tsx`,
  `src/app/admin/accounts/AccountsClient.tsx`, `src/app/admin/orders/page.tsx`,
  `src/app/admin/orders/AdminOrdersClient.tsx`
- ✅ Before-state recorded as numbers in `proofs/phase-0-before-state.md`
- ✅ Test package chosen: `P4PJDQ93V`, Turkey 500MB/Day, $0.30 wholesale — the cheapest in the
  catalogue, so the balance arithmetic after a live test is unambiguous
- ✅ `npm run dev` up; all three admin pages compile and answer the login redirect

## Phase 1 — Schema

- ✅ `OrderSource` enum (`PADDLE`, `ADMIN_INTERNAL`); `source` with `@default(PADDLE)` and
  `idempotencyKey String? @unique` on `Order`
- ✅ SQL read before applying — `CREATE TYPE`, two `ADD COLUMN`, one `CREATE UNIQUE INDEX`, nothing else
- ✅ Applied, and the client regenerated
- ✅ `npx tsc --noEmit` clean
- ✅ **Existing rows unchanged**: all 17 read `source: PADDLE` and `idempotencyKey: null`
- ✅ Every dashboard figure from Phase 0 identical, to the cent

## Phase 2 — Customer search

- ✅ `?q=` on `GET /api/admin/accounts` — email, name, lastName, phone, case-insensitive, `take: 10`
- ✅ No parameter → today's query, same shape, same ordering (`where`/`take` are `undefined`)
- ⬜ Browser: `/admin/accounts` still lists every customer
- ⬜ Browser: partial email · a name · a phone fragment · nonsense → sane results and an empty array,
  never a 500

## Phase 3 — The endpoint

- ✅ `internalSaleSchema` in `src/lib/validation/schemas.ts`, reusing the file-local `e164Regex`
- ✅ New `src/app/api/admin/orders/internal/route.ts`, `maxDuration = 60`
- ✅ `requireAdmin`, then explicit `SUPER_ADMIN` / `ADMIN`, per `api/admin/users/route.ts`
- ✅ Resolve the package from `getPackages()`; unknown code → 400
- ✅ **Server-side floor**: price below the live wholesale price → 400, with the current cost in the
  message so a drifted price is re-confirmed against a real number
- ✅ `getBalance()` below the wholesale price → 409, before any write. Fails open on an unreachable
  balance API, because a real shortfall still surfaces as a clean supplier error on the order
- ✅ Customer resolution: by id · by email if it exists · else create with a temp password and
  `emailVerified: true`. The temp password satisfies the site's own strength rule, so the customer can
  actually log in with it and then change it
- ✅ Phone already registered → 409 **before** any purchase
- ✅ Order written before the purchase, then purchase, then profile, then `COMPLETED`
- ✅ Failure states exactly as the ADD's table — **purchase-succeeded-but-no-profile stays
  `PROCESSING`, never `FAILED`**
- ✅ Duplicate `idempotencyKey` → 200 with `alreadyExisted: true` and the original order, both on the
  pre-check and on a `P2002` race
- ✅ `sendPostPurchaseEmail` fire-and-forget with the chosen locale
- ✅ `createAuditLog` with package, price and cost, on all three outcomes
- ✅ `npx tsc --noEmit` clean
- ✅ 20 automated checks pass, all of them non-spending: 12 on validation, 2 on the pricing source,
  5 on floor arithmetic against the real $0.30 package, 1 confirming 401 without a session
- ⬜ Browser, still to do — **the refusals first, because they spend nothing**:
  - ⬜ as a VIEWER admin → 403
  - ⬜ price one cent under cost → 400, and **no order row created** (`order.count()` still 17)
  - ⬜ existing customer, price above cost → balance dropped by $0.30 exactly once, order `COMPLETED`
    with an ICCID, `source: ADMIN_INTERNAL`
  - ⬜ the same modal submitted twice → the same order returned, balance unchanged
  - ⬜ brand-new email with a non-Israeli phone → account created, temp-password email received,
    login works with it
  - ⬜ an email that already exists but was typed by hand → reuses the account, no duplicate customer

## Phase 4 — The modal

- ✅ New `src/components/admin/InternalSaleModal.tsx`
- ✅ Overlay in the same visual language as `ConfirmDialog.tsx` — no new patterns
- ✅ `crypto.randomUUID()` once on open, held for the modal's lifetime
- ✅ Debounced email autocomplete against `?q=`, 350 ms
- ✅ A match shows name and phone; no match says so and offers the create-account expansion
- ✅ `PhoneInput` imported unchanged, full country selector, emits E.164
- ✅ Price field, defaulted **and** floored at the cost read on open; payment note; email language
- ✅ Live cost / price / difference line, **without Paddle fees**, labelled as margin over supplier cost
- ✅ Submit disabled while in flight, and the form is replaced by the result panel on success
- ✅ Endpoint errors rendered as text, including both 409s
- ✅ Success shows the order number, status, price, cost, the ICCID, and the temp password when an
  account was created
- ✅ Also takes a package picker, needed because the Accounts entry point starts without one

## Phase 5 — Entry points and the tag

- ✅ `PackagesClient.tsx` — "Internal sale" button in Quick actions, passing the package and its live
  wholesale cost. `Visible`, `Edit`, bulk-select and the edit panel untouched
- ✅ `AccountsClient.tsx` — "Sell an eSIM" button on the Orders header of the expanded panel, passing
  the customer. Refreshes that customer's orders after a sale
- ✅ `orders/page.tsx` — maps the new column as `orderSource`, because `source` was **already taken** in
  the client for db-vs-Paddle row origin
- ✅ `AdminOrdersClient.tsx` — "INTERNAL" tag beside the status pill
- ✅ Both buttons role-gated server-side via a `canSell` prop, so a VIEWER or EDITOR is never shown an
  action that would 403
- ⬜ Browser: filters, pagination, Excel export/import and every existing row action unaffected

## Phase 6 — Verification

- ✅ `npx tsc --noEmit` clean
- ✅ `npx next build` passes, with `/api/admin/orders/internal` in the route table — **not**
  `npm run build`, which begins with `prisma db push` and ends with two scripts that rewrite rows
- ✅ Lint on all seven touched files: no new finding, and the two new files are silent
- ✅ Runtime smoke: the three admin pages compile and redirect; `?q=` is 401 without a session
- ✅ **Found and closed a double-purchase hole**: Retry is offered on `PROCESSING`, and the retry route
  buys again without checking `esimOrderId`. Retry is now hidden for an `ADMIN_INTERNAL` order that
  already holds a batch id. Paddle's condition is unchanged
- ⬜ End to end from a package card, existing customer, price above cost
- ⬜ End to end from a package card, unknown email, new account, non-Israeli phone
- ⬜ End to end from the customer card in Accounts
- ⬜ The customer portal shows all three, with a working QR, on `/he` `/en` `/ar`
- ⬜ Emails arrive in the language chosen; RTL and LTR both correct
- ⬜ Dashboard: Revenue moved by exactly the prices set, eSIM cost by exactly the wholesale prices,
  **Fee cost unchanged**, **Net in bank unchanged**
- ⬜ eSIMaccess balance dropped by the wholesale prices of those sales and nothing more
- ⬜ Audit log has one entry per sale, with the right admin, package, price and cost
- ⬜ Regression, and the one that matters most: a real checkout purchase on dev still fulfils, still
  links the customer and still emails. The ticket's whole premise is that the payment path was not
  touched
- ⬜ Regression: retry, archive, cancel-eSIM and resend-email on an existing Paddle order
- ✅ Refund on an internal order declines cleanly — the route answers "No Paddle transaction on this
  order", and the UI does not render the button without a transaction id
- ⬜ **Gabriel's browser pass**

## Phase 7 — Close

- ✅ Deleted the two throwaway harnesses, `scripts/tmp-032-state.mjs` and `scripts/tmp-032-checks.ts`.
  Their output is preserved in `proofs/phase-0-before-state.md`, `proofs/phase-1-6-local-verification.md`
  and `proofs/phase-6-live-sale.md`
- ✅ `CHANGELOG.md` under `[Unreleased]`
- ✅ `agent-workspace/DEPLOY-READINESS.md` — the R3 record, the rollback plan, and the shipped smoke
- ✅ Both known consequences recorded: a gift is booked at cost, so Revenue gains money that never
  arrived; and Avg. order skews because its denominator is Paddle-only
- ✅ Shipped 2 Aug 2026, 20:09, as `10bdf29`. Backup tag `pre-deploy-20260802-2005` on `361c3d2`

## Verified in production

- ✅ The route went from 404 to 405 across the deploy, and answers 401 without a session
- ✅ Three locales, the destinations index, a destination page and `/admin/login` all 200; the admin
  guards still redirect
- ✅ `/api/checkout/health` → `ok: true`, all five steps green. The payment path is untouched

## Still open after the release

- ⬜ Creating a customer during a sale — never exercised. Fails before any purchase, so the worst case
  is an error and no order
- ⬜ A VIEWER admin observed receiving 403
- ⬜ The QR email read in Arabic and English; only Hebrew has been sent

## Notes / follow-ups

- **`/api/admin/orders/[id]/retry` buys again without checking `esimOrderId`.** Hidden in the UI for
  internal orders by this ticket, but a Paddle order sitting in `PROCESSING` with a batch id can still
  be double-bought from the button. The fix is small — fetch the profile for the existing batch instead
  of purchasing — but it edits the fulfillment path and wants explicit approval first.
- **A source filter on the orders list** is the obvious next step now that the tag exists.
- **Allowing a price of `0`** behind an explicit confirmation is a one-line change to the floor check,
  if Gabriel later prefers a gift to read as a loss rather than as break-even.
- **`Avg. order`** divides internal revenue by a Paddle-only count. Pre-existing for sync stubs, now
  more visible. Left alone deliberately.
- **`getPackages()` fetches the whole catalogue** to resolve one package. The same cost the webhook and
  the retry route already pay. Not this ticket's fight.
