# PRD — Ticket 015: Orders: Management Actions + Archive

## Background

Following Ticket 014 (unified list + visibility), the admin can now see all orders and their full details. This ticket adds the ability to **act** on orders:

- The `cancelOrder` eSIMAccess function is implemented in `src/lib/esimaccess.ts` but never wired to any route or UI.
- Paddle refunds are done manually via the Paddle Dashboard — no in-app path exists.
- There is no archive/soft-delete mechanism — deleted means gone.
- The admin cannot edit individual order fields (e.g. fix a customer email, add a note).
- Post-purchase emails can only be triggered by retrying fulfillment — no standalone "resend email" action.

## Decision: Soft Delete = Archive
All "deleted" orders go to an `archivedAt` timestamp field. Nothing is ever hard-deleted. The admin can toggle "Show archived" in the filter.

## User Stories

- As an admin, I want to **archive** an order (remove from main view, keep in DB) with one click and a confirmation.
- As an admin, I want to **cancel an eSIM** directly — calling eSIMAccess and updating the order status to `CANCELLED` — without visiting the eSIMAccess dashboard.
- As an admin, I want to **issue a Paddle refund** from the order panel with a confirmation showing the exact amount and customer name.
- As an admin, I want to **edit order fields** manually (fix customer email, add internal notes, correct a status).
- As an admin, I want to **resend the post-purchase email** to a customer if they say they didn't receive it.
- Every action must be **logged** in the audit log.

## Functional Requirements

### Archive
- Adds `archivedAt` timestamp to order record
- Order disappears from default view (unless "Show archived" filter is on)
- Can be unarchived (clear `archivedAt`)
- Confirmation: "Archive order #XXXX? It will be hidden from the main list."

### Cancel eSIM (eSIMAccess)
- Only available if order has `esimOrderId` (i.e. a purchase was made at eSIMAccess)
- Calls `cancelOrder(esimOrderId)` on eSIMAccess
- On success: updates order `status = CANCELLED`
- eSIMAccess only allows cancellation of unused eSIMs — if the eSIM has been used, the API returns an error which must be shown clearly
- Confirmation: "Cancel eSIM order at eSIMAccess? This will refund your eSIMAccess balance if the eSIM is unused."

### Refund (Paddle)
- Only available if order has `paddleTransactionId`
- Calls Paddle Adjustments API: `POST https://api.paddle.com/adjustments`
- Refund type: `full` (full amount)
- Confirmation dialog: shows order number, customer name, amount, "This will issue a full refund of $XX.XX to the customer's payment method."
- On success: updates order `status = REFUNDED`
- On Paddle error: show error message, do not update status

### Edit Order Fields
- Editable fields: `customerEmail`, `customerName`, `status` (manual override), `errorMessage` (clear/edit), internal `notes` (new optional field)
- Non-editable fields: amounts, ICCID, Paddle ID, eSIM order ID (immutable)
- Save action logged in audit log with before/after values

### Resend Post-Purchase Email
- Only available for COMPLETED orders with a profile (has `iccid` and `qrCodeUrl`)
- Calls existing `sendPostPurchaseEmail` with order data
- Confirmation: "Resend eSIM instructions to customer@email.com?"

### Retry (existing)
- Already exists — keep as-is, ensure it's present in the new actions panel (Ticket 014)

## Security Requirements
- All actions: admin session required (server-side check)
- All actions: logged in `AuditLog` with `adminUserId`, action type, `orderId`, before/after snapshot
- Refund endpoint: no additional re-auth required (admin 2FA covers this at login)

## Out of Scope
- Partial refunds (full refund only for now)
- Bulk cancel / bulk refund
- Automated cancel/refund workflows
