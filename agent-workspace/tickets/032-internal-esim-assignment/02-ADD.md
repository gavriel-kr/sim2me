# Ticket 032 — Architectural Design (ADD)

Scope as cut back by Gabriel on 2026-08-02: purchase only, price floored at cost, two entry points.
No sync, no cron, no retroactive assignment, no editable cost.

## Principles

- **One endpoint, one modal, two buttons.** Two entry points are two buttons, not two features.
- **The payment path is not touched.** `src/app/api/webhooks/paddle/route.ts` is the highest-risk file
  in the repo. This ticket copies its proven fulfillment sequence rather than refactoring it into a
  shared helper. ~40 duplicated lines is a smaller risk than a new abstraction under the money path.
- **The customer portal is not touched at all.** `/api/account/orders` reads by `customerId` OR
  `customerEmail`, with no status and no source filter, so an internal order surfaces there for free.
  Any code written for the portal is code that can break the portal.
- **Additive schema only.** Two columns, both with safe defaults. No rename, no drop, no retype.
- **Nothing new is invented where something exists.** `PhoneInput`, `e164Regex`, `purchasePackage`,
  `getEsimProfileWithRetry`, `getBalance`, `sendPostPurchaseEmail`, `createAuditLog` and
  `ConfirmDialog`'s overlay are all in place and are used as they are.

## 1. Schema — `prisma/schema.prisma`

```prisma
enum OrderSource {
  PADDLE          // paid through checkout — today's only path
  ADMIN_INTERNAL  // sold from the admin panel by this ticket
}

model Order {
  // ...
  source          OrderSource @default(PADDLE)
  idempotencyKey  String?     @unique
}
```

`source` defaults to `PADDLE`, so every existing row keeps a valid value and the migration needs no
backfill to be correct.

`idempotencyKey @unique` is the double-purchase guard. The modal mints one key when it opens; the
insert either succeeds or violates the constraint. A disabled button is a UI courtesy, not a
guarantee, and here the failure costs real money out of a prepaid balance.

`createdByAdmin` was considered and dropped — `AdminAuditLog` already records who did what, and a
second copy of the same fact is a second thing to keep true.

### Why not reuse `paddleTransactionId` for idempotency

It is already `@unique`, so writing `internal-<uuid>` into it would need no migration. Rejected: both
`src/app/admin/page.tsx` and `src/app/admin/orders/page.tsx` branch on
`paddleTransactionId != null` to decide whether Paddle fees apply, so every internal order would be
charged a fee it never incurred and would land in "Net in bank". A constraint trick that corrupts
three figures is not a shortcut.

## 2. API — `POST /api/admin/orders/internal`

New file `src/app/api/admin/orders/internal/route.ts`, with `export const maxDuration = 60` — the same
allowance the webhook and the retry route take for provisioning retries.

```ts
{
  idempotencyKey: string,          // uuid minted by the modal
  packageCode: string,
  customer:
    | { id: string }                                              // from the Accounts entry point
    | { email: string; name: string; lastName?: string; phone: string },
  priceToCustomer: number,         // >= supplier cost, no ceiling
  paymentNote?: string,            // "bank transfer", "compensation" — stored in the existing notes
  emailLocale: 'he' | 'en' | 'ar',
}
```

Validated by a new `internalSaleSchema` in `src/lib/validation/schemas.ts`, beside the existing ones,
reusing the file-local `e164Regex` for the phone.

### Authorization

`requireAdmin(session)` first, then an explicit role check:

```ts
const role = (session!.user as { role: string }).role;
if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') return 403;
```

Exactly the pattern in `src/app/api/admin/users/route.ts`. `requireAdmin` alone admits a VIEWER, which
is not acceptable for an action that spends the balance.

### Sequence

1. Validate the body.
2. Resolve the package from `getPackages()` — name, destination, volume, duration, wholesale price.
   An unknown `packageCode` is a 400, never a purchase.
3. **Enforce the floor on the server**: `priceToCustomer < wholesalePrice` → 400. The UI blocks it
   too, but the API is where it has to be true.
4. `getBalance()`. Below the wholesale price → 409, before anything is written.
5. Resolve or create the customer (§4).
6. Create the order: `status: PROCESSING`, `source: ADMIN_INTERNAL`, `idempotencyKey`,
   `totalAmount: priceToCustomer`, `supplierCost: wholesalePrice`, `customerId`, `notes` from the
   payment note, `paddleTransactionId: null`.
7. `purchasePackage(packageCode, 1)` → store `esimOrderId` and `esimTransactionId`.
8. `getEsimProfileWithRetry(orderNo, 5, 5000)` → `COMPLETED` with `iccid`, `qrCodeUrl`,
   `smdpAddress`, `activationCode`.
9. `sendPostPurchaseEmail(email, {...}, emailLocale)`, carrying `tempPassword` when the account was
   just created. Fire-and-forget — a mail failure must not fail a paid-for eSIM.
10. `createAuditLog({ action: 'INTERNAL_ESIM_SALE', targetType: 'Order', ... })` with package, price
    and cost.

### Failure states

| Failure | Order ends as | Why |
|---|---|---|
| Price below cost, or unknown package | Nothing written | Refuse before spending |
| Balance too low | Nothing written | Refuse before spending |
| `purchasePackage` throws | `FAILED` + `errorMessage`, no `esimOrderId` | Nothing was charged |
| Purchase succeeded, profile never arrives | `PROCESSING` + `errorMessage`, `esimOrderId` set | **The webhook marks this `FAILED`. Here it must not.** `FAILED` invites the retry action, which would buy a second eSIM for an order already paid for. `PROCESSING` with the batch id recorded is the honest state, and the existing `esim-status` and backfill-credentials tools finish the job |
| Duplicate `idempotencyKey` | The first order, returned as-is | 200 with `alreadyExisted: true`; the modal shows that order instead of an error |
| Customer email already exists | Reuses that account | Never a hard failure — the admin may type an address autocomplete did not surface |
| Phone already registered | 409, before any purchase | Same shape as `api/account/register` |

## 3. Which cost, and what happens when it moves

**The floor and the recorded cost are both the live eSIMaccess wholesale price**, `pkg.price / 10000`,
resolved server-side at submit time. Two consequences worth stating:

- **`PackageOverride.simCost` is not used.** That override exists for profit modelling on the packages
  page; the balance only responds to what the supplier actually charges. Flooring against a modelled
  number would let a real sale go out under real cost.
- **Price drift is handled, not ignored.** The modal shows the cost it read when it opened. If the
  supplier price rose in between and the submitted price now falls under it, the API returns 400 with
  the new cost in the message, so the admin re-confirms against a real number instead of silently
  selling at a loss.

## 4. Customer resolution

- `{ id }` → load and use.
- `{ email, ... }` → `findUnique` on the lowercased email first; **if it exists, use it.**
- Otherwise create, following the webhook's pattern exactly: random temporary password hashed with
  bcrypt, name split into first and last, and **`emailVerified: true`**. That flag is not optional —
  `authorize()` throws `EMAIL_NOT_VERIFIED` for unverified customers, so without it the temporary
  password we email is unusable.

## 5. Customer autocomplete — `GET /api/admin/accounts?q=`

The route today returns **every** customer when called with no parameters. Adding `?q=` — matched
case-insensitively against email, name, lastName and phone, `take: 10` — keeps the modal from pulling
the whole customer base into the browser each time it opens. The no-parameter response is unchanged,
so `AccountsClient` is unaffected.

## 6. UI

### `src/components/admin/InternalSaleModal.tsx` — new

Placed beside `AdminSidebar` in `components/admin/`, because two different admin pages mount it.

Props are what the caller already knows: an optional `packageCode`, an optional `customerId`, and
`onDone`. Everything else is internal state. `crypto.randomUUID()` on open, held for the modal's
lifetime, is the idempotency key.

Contents, top to bottom: the package being sold, locked · email with debounced autocomplete and the
create-account expansion · `PhoneInput` imported unchanged · price · payment note · email language ·
a live cost / price / difference line · submit.

The overlay copies `src/app/admin/orders/ConfirmDialog.tsx` — `fixed inset-0 z-50 … bg-black/40` with
a `rounded-2xl bg-white p-6 shadow-xl` panel — so this introduces no new visual language.

**The live figure is `price − cost`, and Paddle fees are deliberately not applied.** The package card
next to it shows `computeProfit`, which subtracts a Paddle percentage and a fixed fee. An internal
sale has no Paddle transaction and therefore no such fee, so reusing `computeProfit` here would
under-report every internal sale. The modal labels the number plainly as the margin over supplier
cost.

### Entry points

| File | Change |
|---|---|
| `src/app/admin/packages/PackagesClient.tsx` | A third button in the Quick actions row beside `Visible` and `Edit`, opening the modal with `packageCode` |
| `src/app/admin/accounts/AccountsClient.tsx` | A button in the expanded customer panel, at the Orders section, opening the modal with `customerId` |
| `src/app/admin/orders/page.tsx` | **Add `source` to the object the page maps into the client.** The page passes an explicit field list, so a new column is invisible to the client until it is added here |
| `src/app/admin/orders/AdminOrdersClient.tsx` | An "Internal" tag beside the status pill when `source === 'ADMIN_INTERNAL'` |

Both buttons are role-gated in the UI as well, so an EDITOR is never shown an action that will 403.

## 7. Reporting semantics

Formulas are not redefined by this ticket. What follows is the consequence, written down so it is a
decision rather than a surprise.

| Figure | With an internal sale |
|---|---|
| Revenue — `SUM(totalAmount)` where `COMPLETED` | **Included.** Correct when the money genuinely arrived through another channel |
| eSIM cost — `SUM(supplierCost)` where `esimOrderId != null` | **Included**, at the real wholesale price |
| Fee cost — `COMPLETED` and `paddleTransactionId != null` | **Excluded.** No Paddle transaction, no Paddle fee. Already today's behaviour |
| Net in bank | **Excluded.** Paddle-only, which is what "in bank" means |
| Avg. order | Denominator is Paddle-only while the numerator includes internal revenue, so it skews low. Pre-existing for sync stubs; `source` is what makes fixing it possible later |

**One honest gap, from the price floor.** A gift — an eSIM handed over for nothing — still has to be
recorded at cost or above, so Revenue gains an amount that never arrived and the order reads as
break-even instead of as a loss. This follows directly from Gabriel's decision that the floor is cost,
and it is recorded rather than worked around. Allowing `0` behind an explicit confirmation is a
one-line change to step 3 if he later prefers the books to be literal.

## What is deliberately not done

- **No shared fulfillment module.** Extracting the purchase-and-provision sequence would put new code
  inside the Paddle webhook. Duplicated, the webhook keeps behaving exactly as it does today.
- **No change to the sync route, and no cron.** Cut from scope. eSIMs Gabriel buys directly at
  eSIMaccess stay outside the site; `esim_additional_cost` in `SiteSetting` is the existing knob for
  reflecting that spend on the dashboard.
- **No new dependency.** `react-phone-number-input` is installed and already wrapped by
  `src/components/PhoneInput.tsx`.
- **No quantity field.** One eSIM per action. Bulk gifting is a different feature with a different
  confirmation story.
- **No customer-facing sign of "internal".** The customer sees a normal order and a normal email.

## Risk and rollback

**R3** — the ticket changes `prisma/schema.prisma`, and `npm run build` begins with `prisma db push`.
By subject matter it is R2 on its own: eSIM provisioning, orders, prices, and an endpoint that spends
from a prepaid balance.

**Rollback plan, written before any code as R3 requires.** The two columns are additive and inert
without the code that reads them: `source` has a default, `idempotencyKey` is nullable, and no
existing query selects either. Reverting the code is therefore a complete rollback on its own, with no
data loss and no DB step. Dropping the columns is possible but unnecessary, and would be the only
destructive action in the plan — so it is explicitly not part of it. Every file this ticket edits is
copied to `backup/` before the first change, and the eSIMaccess balance plus the four dashboard money
figures are recorded before and after, so an unintended movement is detectable rather than argued
about.
