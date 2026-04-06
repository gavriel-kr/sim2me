# ADD — Ticket 018: Fraud Protection & Auto-Blocking

## Architecture Overview

### New DB Table: `BlockedItem`
```prisma
model BlockedItem {
  id          String   @id @default(cuid())
  type        String   // 'IP' | 'EMAIL'
  value       String   // the IP address or email
  reason      String?  @db.Text
  autoBlocked Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@unique([type, value])
  @@map("blocked_items")
}
```

### Schema Change: `Order.checkoutIp`
```prisma
// Add to Order model:
checkoutIp  String?  // IP captured at checkout prepare time
```

### IP Extraction
- Use existing `getClientIp()` from `src/lib/rateLimit.ts` (checks x-forwarded-for, x-real-ip headers).
- Pass IP as `checkoutIp` in customData from `/api/checkout/prepare` → stored on Order in webhook.

### Block Enforcement: `/api/checkout/prepare`
1. Extract IP from request headers.
2. Check `BlockedItem` table for `{ type: 'IP', value: ip }` OR `{ type: 'EMAIL', value: customerEmail }`.
3. If blocked → return `{ error: 'Access denied', status: 403 }`.
4. Continue with normal flow.

### Auto-Block Triggers
**Underpayment** (`src/app/api/webhooks/paddle/route.ts`):
- After fraud detection → call `autoBlock({ type: 'IP', value: customData.checkoutIp })` + `autoBlock({ type: 'EMAIL', value: customerEmail })`.

**3+ FAILED** (`src/lib/fraud.ts` — new utility):
```typescript
export async function checkAndAutoBlockEmail(email: string): Promise<void>
```
- Count `Order` records: `{ customerEmail: email, status: 'FAILED', createdAt: { gte: 24h ago } }`.
- If count ≥ 3 → upsert `BlockedItem { type: 'EMAIL', value: email, autoBlocked: true }`.
- Called from webhook FAILED path and retry FAILED paths.

### Admin API Routes (new)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/blocklist` | List all blocked items (paginated) |
| POST | `/api/admin/blocklist` | Manually add block (IP or EMAIL) |
| DELETE | `/api/admin/blocklist/[id]` | Remove a block |
| POST | `/api/admin/blocklist/scan` | Retroactive fraud scan → bulk block |

### Admin UI
- New page: `/admin/blocklist` — table of all blocked items with unblock button.
- Orders page: "Block Email" button in expanded order panel → calls POST `/api/admin/blocklist`.

### Retroactive Scan Logic (`/api/admin/blocklist/scan`)
1. Find emails with 3+ FAILED orders → block them.
2. Find emails appearing in underpayment FAILED orders (errorMessage contains "Blocked: underpayment") → block them.
3. Return count of newly blocked items.

## File Map
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `BlockedItem` model, add `checkoutIp` to `Order` |
| `src/lib/fraud.ts` | New: `autoBlock()`, `checkAndAutoBlockEmail()` helpers |
| `src/app/api/checkout/prepare/route.ts` | IP extraction, blocklist check, pass checkoutIp |
| `src/app/api/webhooks/paddle/route.ts` | Save checkoutIp, call autoBlock on underpayment + 3-failure check |
| `src/app/api/admin/orders/[id]/retry/route.ts` | Call checkAndAutoBlockEmail on failure |
| `src/app/api/account/orders/[id]/retry/route.ts` | Same |
| `src/app/api/admin/blocklist/route.ts` | GET list + POST add |
| `src/app/api/admin/blocklist/[id]/route.ts` | DELETE unblock |
| `src/app/api/admin/blocklist/scan/route.ts` | POST retroactive scan |
| `src/app/admin/blocklist/page.tsx` | Admin blocklist management UI |
