# ADD — Ticket 005: Security Hardening

## Architecture Overview

Four independent, minimal changes. Each phase is self-contained with no cross-dependencies.
Zero new npm dependencies. All changes follow existing patterns.

---

## Phase 1 — Admin Route Authorization

### Pattern (already exists in `src/app/api/admin/accounts/route.ts`)
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
if ((session.user as { type?: string }).type !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Approach: Shared helper
Extract the admin check into `src/lib/session.ts` (already contains session helpers) as:
```typescript
export function requireAdmin(session: Session | null): NextResponse | null
```
Returns a 401/403 `NextResponse` if unauthorized, or `null` if the request is allowed.
This avoids duplicating the type-cast and error response in 10 files.

### Routes to fix (add admin type check)
| File | Current check |
|------|--------------|
| `src/app/api/admin/orders/bulk-update/route.ts` | session only |
| `src/app/api/admin/orders/[id]/retry/route.ts` | session only |
| `src/app/api/admin/esimaccess/packages/route.ts` | session only |
| `src/app/api/admin/esimaccess/orders/route.ts` | session only |
| `src/app/api/admin/esimaccess/sync/route.ts` | session only |
| `src/app/api/admin/articles/route.ts` | session only |
| `src/app/api/admin/pages/route.ts` | session only |
| `src/app/api/admin/packages/override/route.ts` | session only |
| `src/app/api/admin/destinations/route.ts` | session only |
| `src/app/api/admin/packages/apply-price-floor/route.ts` | session only |

---

## Phase 2 — Admin Purchase Notification Email

### New function in `src/lib/email.ts`
```typescript
export async function sendAdminOrderNotificationEmail(data: AdminOrderNotificationData): Promise<void>
```

**Data interface:**
```typescript
interface AdminOrderNotificationData {
  customerName: string;
  customerEmail: string;
  packageName: string;
  destination: string;
  dataAmount: string;
  validity: string;
  amountCharged: number;    // USD retail
  supplierCost: number;     // USD wholesale
  orderId: string;
  orderNo: string;
  adminOrdersUrl: string;   // direct link
}
```

**Recipient:** `process.env.ADMIN_NOTIFICATION_EMAIL || 'info.sim2me@gmail.com'`

**Email content:** Clean English plain-info email (not RTL). Contains all fields above in a simple table layout. Fire-and-forget (non-fatal if fails).

### Where called
`src/app/api/webhooks/paddle/route.ts` — after `prisma.order.create()` succeeds and order details are known, before the try/catch for fulfillment (so notification fires even if eSIM provisioning fails).

---

## Phase 3 — Remove Debug Fetch Artifacts

### Files
- `src/lib/esimaccess.ts` — remove `fetch('http://127.0.0.1:7242/...')` lines
- `src/app/api/admin/packages/override/route.ts` — remove `fetch('http://127.0.0.1:7242/...')` lines

Simple deletion, no replacement logic needed.

---

## Phase 4 — Rate Limiting

### Constraint: Serverless environment
Vercel runs each request in an isolated serverless function. In-memory rate limiting (Map/counter) resets on every cold start and is **not reliable** on serverless.

### Solution: DB-backed rate limit via Prisma (no new dependencies)
Use the existing `SiteSetting` table (key-value store) OR a simple approach:
- Create a new `RateLimit` model in Prisma (key: `ip:endpoint`, count, windowStart)
- On each request: upsert the record, check count against limit, reject if exceeded

### New Prisma model
```prisma
model RateLimit {
  key         String   @id  // "{ip}:{endpoint}"
  count       Int      @default(1)
  windowStart DateTime @default(now())
}
```

### New helper: `src/lib/rateLimit.ts`
```typescript
export async function checkRateLimit(ip: string, endpoint: string, limit: number, windowSec: number): Promise<boolean>
// returns true = allowed, false = rate limited
```

### Limits
| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/checkout/create-transaction` | 10 req | 60s |
| `POST /api/account/register` | 5 req | 60s |
| `POST /api/auth/token` | 10 req | 60s |
| `POST /api/contact` | 3 req | 60s |

### IP extraction
Use `request.headers.get('x-forwarded-for')` (Vercel sets this). Fall back to `'unknown'`.

### Cleanup
Old `RateLimit` rows cleaned up via a simple check: if `windowStart` is older than the window, reset count to 1.

---

## Files Modified

| File | Change |
|------|--------|
| `src/lib/session.ts` | Add `requireAdmin()` helper |
| `src/app/api/admin/orders/bulk-update/route.ts` | Use `requireAdmin()` |
| `src/app/api/admin/orders/[id]/retry/route.ts` | Use `requireAdmin()` |
| `src/app/api/admin/esimaccess/packages/route.ts` | Use `requireAdmin()` |
| `src/app/api/admin/esimaccess/orders/route.ts` | Use `requireAdmin()` |
| `src/app/api/admin/esimaccess/sync/route.ts` | Use `requireAdmin()` |
| `src/app/api/admin/articles/route.ts` | Use `requireAdmin()` |
| `src/app/api/admin/pages/route.ts` | Use `requireAdmin()` |
| `src/app/api/admin/packages/override/route.ts` | Use `requireAdmin()` + remove debug fetches |
| `src/app/api/admin/destinations/route.ts` | Use `requireAdmin()` |
| `src/app/api/admin/packages/apply-price-floor/route.ts` | Use `requireAdmin()` |
| `src/lib/email.ts` | Add `sendAdminOrderNotificationEmail()` |
| `src/app/api/webhooks/paddle/route.ts` | Call admin notification email |
| `src/lib/esimaccess.ts` | Remove debug fetches |
| `src/lib/rateLimit.ts` | New — DB-backed rate limit helper |
| `prisma/schema.prisma` | Add `RateLimit` model |
| `src/app/api/checkout/create-transaction/route.ts` | Add rate limit check |
| `src/app/api/account/register/route.ts` | Add rate limit check |
| `src/app/api/auth/token/route.ts` | Add rate limit check |
| `src/app/api/contact/route.ts` | Add rate limit check |

Total: 2 new files, 18 modified files. One additive schema change (new model, no migration risk).
