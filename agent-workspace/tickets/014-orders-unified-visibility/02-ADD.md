# ADD — Ticket 014: Orders: Unified List + Full Transparency

## Architecture Overview

The solution extends the existing server-rendered admin orders page with two new async data layers:
1. **Paddle abandoned fetch** — client-side, one call per page load, merged into the list.
2. **eSIMAccess live fetch** — per-order on expand, via a new admin API route.

No schema changes. No new dependencies. Follows existing patterns: server component → client component, Prisma on server, fetch on client.

---

## Data Flow

```
page.tsx (server)
├── prisma.order.findMany() → serialized orders → AdminOrdersClient
│
AdminOrdersClient (client)
├── On mount: fetch GET /api/admin/orders/abandoned → merge abandoned into list
│   └── Paddle API → GET /transactions?status[]=billed&status[]=ready&status[]=past_due
│       De-dup by paddleTransactionId against DB orders
│
└── On row expand:
    └── fetch GET /api/admin/orders/[id]/esim-status
        ├── getEsimUsage(iccid) → usage/status/expiry
        └── getEsimProfile(esimOrderId) → fallback if no iccid
```

---

## New API Routes

### `GET /api/admin/orders/abandoned`
- Admin auth required
- Calls Paddle REST API: `GET https://api.paddle.com/transactions` with query params:
  - `status[]=billed&status[]=ready&status[]=past_due`
  - `per_page=50` (limit to recent)
  - `order_by=created_at[DESC]`
- Returns: array of `{ paddleTransactionId, customerEmail, amount, currency, createdAt, paddleStatus }`
- Client de-dupes against existing DB orders by `paddleTransactionId`

### `GET /api/admin/orders/[id]/esim-status`
- Admin auth required
- Finds order by `id`, extracts `iccid` and `esimOrderId`
- If `iccid`: calls `getEsimUsage(iccid)` → returns usage + status + expiry
- Else if `esimOrderId`: calls `getEsimProfile(esimOrderId)` → returns profile
- Else: returns `{ noEsim: true }`
- Response shape:
```typescript
{
  status: string;           // eSIMAccess status string
  usedVolume: number;       // bytes
  remainingVolume: number;  // bytes
  orderVolume: number;      // bytes
  expiredTime: number;      // unix ms
  iccid: string;
  qrCodeUrl: string;
  smdpAddress: string;
  activationCode: string;
}
```

---

## UI Changes

### AdminOrdersClient.tsx

**State additions:**
```typescript
const [abandonedOrders, setAbandonedOrders] = useState<AbandonedOrder[]>([]);
const [abandonedLoading, setAbandonedLoading] = useState(true);
const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
const [esimStatusMap, setEsimStatusMap] = useState<Record<string, EsimStatusData>>({});
const [esimLoadingIds, setEsimLoadingIds] = useState<Set<string>>(new Set());
```

**Merged list:** combine DB orders (mapped to unified type) + abandoned orders (mapped to same type with `status: 'ABANDONED'`), sort by `createdAt` descending.

**Row expand:** clicking a row → sets `expandedOrderId`. If order has `iccid` or `esimOrderId` and not yet in `esimStatusMap`, trigger fetch to `/api/admin/orders/[id]/esim-status`.

**Expand panel layout (3 columns on desktop, stacked on mobile):**
```
┌──────────────────┬─────────────────────────┬──────────────┐
│ PADDLE           │ ESIM ACCESS             │ ACTIONS      │
│ txn_xxx          │ 🟢 Active               │ [Archive]    │
│ [Receipt link]   │ ████████░░ 3.2/5 GB     │ [Refund]     │
│ Paid: 12 Mar     │ Remaining: 1.8 GB       │ [Cancel eSIM]│
│ Visa •••4242     │ Expires: 22 Apr 2025    │ [Edit]       │
│                  │ ICCID: 8944...          │ [Resend Mail]│
│                  │ [Show QR]               │              │
└──────────────────┴─────────────────────────┴──────────────┘
```

---

## Paddle API Call (server-side, in new route)

```typescript
const res = await fetch('https://api.paddle.com/transactions?status[]=billed&status[]=ready&status[]=past_due&per_page=50&order_by=created_at[DESC]', {
  headers: {
    'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});
```

Uses existing `PADDLE_API_KEY` env var (already set, used in checkout/create-transaction).

---

## Status Badge Colors

| Status | Color |
|--------|-------|
| COMPLETED | Green |
| PROCESSING | Blue |
| PENDING | Yellow |
| FAILED | Red |
| CANCELLED | Gray |
| REFUNDED | Purple |
| ABANDONED | Orange (dashed border) |

---

## Performance Considerations

- DB orders: server-rendered (no change to current perf)
- Abandoned: async, doesn't block render, shows spinner until loaded
- eSIM status: fetched only on row expand, cached in `esimStatusMap` for session (no re-fetch on collapse/re-expand)
- Paddle deep-link fix: trivial string change

---

## Files Modified / Created

| File | Change |
|------|--------|
| `src/app/admin/orders/AdminOrdersClient.tsx` | Add merged list, expand panel, abandoned loading |
| `src/app/api/admin/orders/abandoned/route.ts` | NEW — Paddle abandoned fetch |
| `src/app/api/admin/orders/[id]/esim-status/route.ts` | NEW — live eSIM data per order |

**No schema changes. No new npm dependencies.**
