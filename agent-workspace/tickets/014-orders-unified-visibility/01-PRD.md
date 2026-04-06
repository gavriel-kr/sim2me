# PRD — Ticket 014: Orders: Unified List + Full Transparency

## Background

The admin orders page (`/admin/orders`) currently shows only orders stored in the DB (created after a successful Paddle `transaction.completed` webhook). Several categories of orders are invisible or poorly displayed:

1. **Abandoned checkouts** — users who opened Paddle checkout but never paid. These exist in Paddle but not in our DB.
2. **FAILED / PENDING orders** — exist in DB but have no visual distinction or priority treatment.
3. **eSIM operational data** — usage (data consumed), live status (active/expired), exact expiry time are never shown to the admin. The admin has no way to see the eSIM's current health without logging into eSIMAccess dashboard.
4. **Paddle transaction details** — the "View in Paddle" deep-link is broken (opens the general transactions page, not the specific transaction). No receipt URL or payment method is shown.

## Goal

One unified order list with complete business transparency — the admin sees everything from both Paddle and eSIMAccess in a single view, without switching dashboards.

## User Stories

- As an admin, I want to see **all order types** (completed, failed, pending, cancelled, abandoned) in a single list so I don't miss anything.
- As an admin, I want to **expand any order** and see live eSIM status — how much data was used, how much remains, when it expires — without opening the eSIMAccess dashboard.
- As an admin, I want to see the **Paddle transaction details** (payment method, receipt link, exact amount) directly in the order panel.
- As an admin, I want **abandoned checkouts** visible so I can understand conversion loss.

## Functional Requirements

### Unified List
- Display DB orders + Paddle abandoned checkouts in one sorted-by-date list.
- Paddle abandoned = Paddle transactions with status `billed` / `ready` / `past_due` that have no matching `paddleTransactionId` in our DB.
- Abandoned rows load **async** (client-side, lazy) after initial page render — so they don't block the main list.
- De-duplication: if a Paddle transaction ID already exists in DB, show only the DB record.
- Status badges: `COMPLETED` / `FAILED` / `PENDING` / `PROCESSING` / `CANCELLED` / `REFUNDED` / `ABANDONED`

### Expandable Order Panel
When admin clicks any order row, a detail panel expands inline with three sections:

**Section A — Paddle Info**
- Paddle Transaction ID (with working deep-link to `vendors.paddle.com/transactions-v2/{id}`)
- Payment status from Paddle
- Payment method
- Receipt / invoice URL

**Section B — eSIMAccess Info (live, loaded on expand)**
- ICCID, SM-DP+ address, activation code, QR code image
- Live eSIM status (active / inactive / expired)
- Data usage bar: `Used X GB / Total Y GB` with visual progress bar
- Remaining data
- Exact expiry date/time
- `errorMessage` (if any) shown prominently in red

**Section C — Actions** (see Ticket 015 for implementation)
- Buttons rendered here; functionality is Ticket 015's scope.

### ABANDONED rows
- Show: date, customer email (if available from Paddle), amount, Paddle link
- No eSIMAccess section (no eSIM was issued)
- Actions: "View in Paddle" only (read-only)

## Non-Goals (this ticket)
- Performing actions (cancel, refund, archive) — Ticket 015
- Filtering / pagination improvements — Ticket 016
- Email notifications — Ticket 017
