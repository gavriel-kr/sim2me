# ADD — Ticket 015: Orders: Management Actions + Archive

## Architecture Overview

Five new admin API routes, one schema migration (additive), and UI action buttons in the expand panel introduced by Ticket 014. Follows existing patterns: admin-auth middleware, Prisma update, audit log entry.

---

## Data Layer — Schema Change

### Order model additions (additive only)
```prisma
archivedAt  DateTime?   // null = active, set = archived
notes       String?     // internal admin notes
```

Migration: `npx prisma db push` — non-destructive, both fields nullable with no default.

---

## New API Routes

### `POST /api/admin/orders/[id]/archive`
```
Body: { archived: boolean }
- archived: true  → set archivedAt = now()
- archived: false → set archivedAt = null
Audit: ARCHIVE_ORDER / UNARCHIVE_ORDER
Returns: { ok: true, archivedAt: string | null }
```

### `POST /api/admin/orders/[id]/cancel-esim`
```
- Verify order has esimOrderId
- Verify order status !== CANCELLED, COMPLETED (guard)
- Call cancelOrder(esimOrderId) from src/lib/esimaccess.ts
- On success: prisma.order.update({ status: 'CANCELLED' })
- On eSIMAccess error: return { ok: false, error: string } — do not update DB
Audit: CANCEL_ESIM_ORDER
Returns: { ok: true } | { ok: false, error: string }
```

### `POST /api/admin/orders/[id]/refund`
```
- Verify order has paddleTransactionId
- Verify order status !== REFUNDED (idempotency guard)
- Call Paddle Adjustments API:
  POST https://api.paddle.com/adjustments
  {
    action: "refund",
    transaction_id: paddleTransactionId,
    reason: "Admin initiated refund",
    items: [{ type: "full", item_id: ... }]   ← or full transaction refund
  }
- On success: prisma.order.update({ status: 'REFUNDED' })
- On Paddle error: return { ok: false, error: string }
Audit: REFUND_ORDER (includes amount)
Returns: { ok: true } | { ok: false, error: string }
```

### `PATCH /api/admin/orders/[id]/edit`
```
Body: { customerEmail?, customerName?, status?, errorMessage?, notes? }
- Validate: only allowed fields accepted (whitelist)
- Capture before-state for audit log
- prisma.order.update({ data: allowedFields })
Audit: EDIT_ORDER (before: {...}, after: {...})
Returns: { ok: true, order: updatedOrder }
```

### `POST /api/admin/orders/[id]/resend-email`
```
- Verify order status === COMPLETED
- Verify order has iccid and qrCodeUrl
- Call sendPostPurchaseEmail(order)
Audit: RESEND_EMAIL
Returns: { ok: true } | { ok: false, error: string }
```

---

## Audit Log Entries

All existing audit log patterns use `prisma.auditLog.create`. New action types:

| Action | Data logged |
|--------|-------------|
| `ARCHIVE_ORDER` | `{ orderId, orderNo, archivedAt }` |
| `UNARCHIVE_ORDER` | `{ orderId, orderNo }` |
| `CANCEL_ESIM_ORDER` | `{ orderId, orderNo, esimOrderId }` |
| `REFUND_ORDER` | `{ orderId, orderNo, paddleTransactionId, amount, currency }` |
| `EDIT_ORDER` | `{ orderId, orderNo, before: {...}, after: {...} }` |
| `RESEND_EMAIL` | `{ orderId, orderNo, customerEmail }` |

---

## Paddle Refund API

Uses existing `PADDLE_API_KEY`. Pattern mirrors `create-transaction` route.

```typescript
const res = await fetch('https://api.paddle.com/adjustments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'refund',
    transaction_id: order.paddleTransactionId,
    reason: 'Refund issued by admin',
    items: [{ type: 'full', item_id: '<line_item_id>' }],
  }),
});
```

> Note: Paddle's full refund requires the line item ID from the original transaction. The `abandoned` route (Ticket 014) already fetches Paddle transaction details which include line items. If not available, use `type: 'full'` with no items array (full transaction refund).

---

## UI Actions (in Ticket 014's expand panel)

Each action button:
1. Shows a **confirmation dialog** (modal) with relevant details
2. On confirm → calls API route
3. Shows loading state on button
4. On success → updates local order state (optimistic or re-fetch row)
5. On error → shows error toast/message

| Action | Condition shown | Dialog content |
|--------|----------------|---------------|
| Archive | Always | "Hide order #XXXX from main list?" |
| Unarchive | Only if archived | "Restore order #XXXX to main list?" |
| Cancel eSIM | Has `esimOrderId`, status ≠ CANCELLED | "Cancel unused eSIM at eSIMAccess? Refunds supplier balance." |
| Refund | Has `paddleTransactionId`, status ≠ REFUNDED | "Issue full refund of $XX to [name]?" |
| Edit | Always | Inline form fields |
| Resend Email | Status = COMPLETED, has ICCID | "Resend eSIM instructions to [email]?" |
| Retry | Status = FAILED/PENDING/PROCESSING | Existing behavior |

---

## Files Modified / Created

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `archivedAt`, `notes` to Order |
| `src/app/api/admin/orders/[id]/archive/route.ts` | NEW |
| `src/app/api/admin/orders/[id]/cancel-esim/route.ts` | NEW |
| `src/app/api/admin/orders/[id]/refund/route.ts` | NEW |
| `src/app/api/admin/orders/[id]/edit/route.ts` | NEW |
| `src/app/api/admin/orders/[id]/resend-email/route.ts` | NEW |
| `src/app/admin/orders/AdminOrdersClient.tsx` | Add action buttons + dialogs |

**No new npm dependencies.**
