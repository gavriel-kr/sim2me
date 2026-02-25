# PRD — Ticket 002: Pricing Floor & Profit Dashboard

## Background
The payment processor (Paddle) has a minimum charge of $0.70. Packages priced between
$0.55 and $0.70 must be sold at $0.70 to avoid failed transactions. Additionally, the
admin dashboard currently shows gross Revenue only; profit (revenue minus wholesale cost)
is needed for business decisions.

## Requirements

### R1 — Price Floor Rule ($0.55–$0.70 → $0.70)
- Any package whose **effective retail price** is ≥ $0.55 and < $0.70 must be raised to
  exactly **$0.70**.
- This is applied by writing a `customPrice = 0.70` override into `PackageOverride`.
- The adjustment must be visible in the back office package list as a custom price edit
  (same as if an admin had manually set the price).
- An admin button **"Apply Price Floor"** in the Packages page triggers a bulk operation:
  fetches all packages from eSIMaccess, identifies those in the $0.55–$0.70 range, and
  upserts their `PackageOverride.customPrice` to 0.70.
- A success count toast confirms how many packages were updated.

### R2 — Back Office: Show Supplier Default Price
- In the package card, always display:
  - **Supplier retail price** (from eSIMaccess `retailPrice` or `price`) — labelled "API Price"
  - **Custom price** (our override) — shown prominently
  - **Wholesale cost** (eSIMaccess `price`) — shown as "Cost"
- Current behaviour (show custom price with API price line-through) is correct; the labels
  should be clearer so admins understand what each number represents.

### R3 — Dashboard: Accurate Profit
- Add a `supplierCost` field to the `Order` model to capture the wholesale cost paid to
  eSIMaccess at fulfillment time.
- Dashboard stats updated to:
  - **Revenue** — sum of `totalAmount` (what customers paid) for COMPLETED orders
  - **Cost** — sum of `supplierCost` for COMPLETED orders
  - **Profit** — Revenue − Cost
  - **Avg. Order** — remains based on revenue
- Supplier cost is saved in the Paddle webhook handler when the package is looked up.

## Out of Scope
- Changing Paddle price IDs automatically (admin must still set `paddlePriceId` manually).
- Frontend price display changes on the customer-facing site.
- Historical orders: `supplierCost` will be NULL for orders before this migration; dashboard
  shows profit only where cost data is available.
