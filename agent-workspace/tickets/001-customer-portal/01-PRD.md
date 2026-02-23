# PRD — Ticket 001: Customer Portal & Auto-Account Creation

## Background
After a successful eSIM purchase via Paddle, customers currently:
1. Do NOT get an account automatically created
2. Must manually register separately
3. See only mock data in the "My eSIMs" section

## Goals
1. **Auto-create account on purchase** — On successful webhook fulfillment, automatically create a Customer record linked to the order (if one doesn't already exist), so the customer can log in immediately.
2. **Real eSIM data in customer portal** — Replace mock data in "My eSIMs" with real orders from DB: QR code, ICCID, SM-DP+, activation code, status.
3. **Admin: orders visible per customer** — In admin account detail, show all orders for that customer with full eSIM details.

## Out of Scope
- No new npm dependencies
- No new eSIMaccess API endpoints beyond what already exists
- No usage/consumption data (not available without a new endpoint)
- No Stripe/other payment changes

## Requirements

### R1 — Auto-create account on purchase
- After successful eSIM fulfillment in webhook, upsert Customer by email
- If new customer: generate secure random temp password (16 chars), hash it, store
- Link the Order to the Customer (set customerId)
- Include login credentials in post-purchase email (already sent in Hebrew)

### R2 — Customer "My eSIMs" page (real data)
- Show all orders for logged-in customer from DB (status: any)
- For COMPLETED orders: show QR code image, ICCID, SM-DP+, activation code, validity
- For PROCESSING/FAILED: show status badge
- Remove all mock data

### R3 — Admin: customer detail includes orders
- In /admin/accounts/[id], show a tab/section with all customer orders
- Include: order #, package, status, date, QR code toggle, retry button (already built)
