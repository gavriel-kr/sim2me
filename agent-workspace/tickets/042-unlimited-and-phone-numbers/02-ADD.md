# Ticket 042 — Architecture

## Product ids — no schema change

One string travels through cart → Paddle `custom_data` → webhook → `Order.packageCode`. The kind is
written into it (`src/lib/product-id.ts`):

| Id | Meaning |
|---|---|
| `CKH491` | eSIMaccess package, exactly as before |
| `dp:<code>:<days>` | eSIMaccess day pass for 1–30 days (bought with `periodNum`) |
| `pk:<code>` | PikaSim phone plan |

A malformed `dp:` id never degrades into a plain eSIMaccess purchase.

## Modules

| File | Role |
|---|---|
| `lib/unlimited.ts` | Pick the 2GB/day pass per destination (cheapest, faster FUP on a tie, admin-hidden excluded); price table 1–30 days: `ceil(cost×days×1.5+0.6)−0.10` |
| `lib/pikasim.ts` | PikaSim API client; catalogue cached in memory 1h; order + poll (their webhook cannot reach localhost) |
| `lib/phone-plans.ts` | Pure rules: region, dial code, price `ceil((cost+0.5)/0.85)−0.10`, market reference (Airalo/Orange, 2026-09-28), default visibility, per-destination selection |
| `lib/phone-catalog.ts` | Catalogue + `PackageOverride` rows keyed `pk:<code>` |
| `lib/fulfillment.ts` | `describeProduct` (name, cost, server price, purchasable) · `placeSupplierOrder` · `awaitProfile` · `supplierBalanceUsd` — used by webhook, internal sale, both retries, checkout |
| `lib/phone-number.ts` | Live MSISDN from PikaSim (only once IN_USE/ENABLED — PikaSim may return a placeholder earlier); one "number ready" email per order, claimed via `SiteSetting` |

## Flow

1. Destination page gets `unlimited` (price table, no wholesale) and `phonePlans` (public fields) from
   `getDestinationData`. `/api/packages` no longer lists day passes as items.
2. Cart holds a normal `Plan` with optional `kind`/`fairUse`/`phone`.
3. `create-transaction` computes the price server-side via `describeProduct`.
4. Webhook: `describeProduct` → create order → `placeSupplierOrder(planId, order.id)` → save supplier
   order no. **before** waiting → `awaitProfile` → email (with "number after installation" box for phone plans).
5. Account / admin status read PikaSim live; first real number → email.

## Safety

- **Checkout lock.** Paddle webhooks go to the live site, whose current code cannot buy `dp:`/`pk:`.
  So `create-transaction` returns `NEW_PRODUCTS_LOCKED` for them unless
  `ENABLE_NEW_PRODUCTS_CHECKOUT=1`. Not set anywhere. Test purchases: admin internal sale.
- Supplier order number is persisted before the profile wait on every path → a retry re-fetches,
  never re-buys. PikaSim also gets our order id as `externalOrderId` (idempotency).
- Underpayment guard in the webhook now uses the right cost for each kind.
- Wholesale cost never reaches the browser.
- PikaSim down → phone tab and homepage section disappear; the rest of the page is unaffected.
