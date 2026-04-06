# ADD — Ticket 016: Orders: Filtering, Search & Pagination

## Architecture Overview

Move order fetching from a one-time server load (500 rows, client-filtered) to a **URL-driven, server-paginated** model. The page.tsx reads URL search params, passes them to Prisma, and returns only the relevant page. Client-side filtering is removed for DB orders (ABANDONED filtering remains client-side since those come from Paddle).

---

## Data Flow (new)

```
URL: /admin/orders?status=FAILED&from=2025-01-01&page=2&q=dana

page.tsx (server, reads searchParams)
├── Build Prisma where clause from searchParams
├── prisma.order.findMany({ where, skip, take: 50, orderBy: createdAt desc })
├── prisma.order.count({ where }) → totalCount
└── Pass { orders, totalCount, currentPage, filters } to AdminOrdersClient

AdminOrdersClient (client)
├── Reads URL params (useSearchParams)
├── Filter UI changes → router.push(new URL with updated params)
│   → triggers server re-render with new params
└── ABANDONED orders: still fetched async client-side (unchanged from Ticket 014)
    → filtered client-side based on status filter
```

---

## Server-Side Filter Logic (`page.tsx`)

```typescript
// searchParams from Next.js App Router page props
const { q, status, country, from, to, archived, page } = searchParams;

const PAGE_SIZE = 50;
const pageNum = Math.max(1, parseInt(page || '1'));
const skip = (pageNum - 1) * PAGE_SIZE;

const where: Prisma.OrderWhereInput = {
  // Search
  ...(q && {
    OR: [
      { customerEmail: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { orderNo: { contains: q, mode: 'insensitive' } },
      { iccid: { contains: q, mode: 'insensitive' } },  // NEW: ICCID search
    ],
  }),
  // Status (exclude ABANDONED — that's Paddle-only)
  ...(status && status !== 'ABANDONED' && {
    status: { in: status.split(',').filter(s => s !== 'ABANDONED') as OrderStatus[] },
  }),
  // Country
  ...(country && { destination: country }),
  // Date range
  ...(from || to) && {
    createdAt: {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to + 'T23:59:59Z') }),
    },
  },
  // Archived filter
  ...(archived === 'archived'
    ? { archivedAt: { not: null } }
    : archived === 'all'
    ? {}
    : { archivedAt: null }),  // default: active only
};
```

---

## URL Management (client)

```typescript
// In AdminOrdersClient:
const router = useRouter();
const searchParams = useSearchParams();

function updateFilter(key: string, value: string | null) {
  const params = new URLSearchParams(searchParams.toString());
  if (value) params.set(key, value);
  else params.delete(key);
  params.delete('page'); // reset to page 1 on filter change
  router.push(`/admin/orders?${params.toString()}`);
}
```

Filter components call `updateFilter` — each change triggers a server re-render with the new URL.

---

## Pagination UI

```
← Prev  |  Page 2 of 17  |  Next →
Showing 51–100 of 843 orders
```

- Prev/Next buttons call `updateFilter('page', String(currentPage ± 1))`
- Disabled when at first/last page

---

## ABANDONED Integration

- ABANDONED orders come from Paddle (async, client-side)
- If status filter includes `ABANDONED`: show ABANDONED rows in list
- If status filter excludes ABANDONED: filter them out client-side
- ABANDONED rows are always page 1 only (no server pagination for them — Paddle returns up to 50 per call)

---

## Files Modified

| File | Change |
|------|--------|
| `src/app/admin/orders/page.tsx` | Read searchParams, build Prisma where, paginate |
| `src/app/admin/orders/AdminOrdersClient.tsx` | URL-driven filters, pagination UI, remove client-side Prisma filter logic |
| `src/app/admin/orders/orderFilters.ts` | Add ABANDONED to status list, add archived filter type |
| `src/app/admin/orders/OrdersFilters.tsx` | Add archived toggle, ensure all filters call updateFilter |

**No new API routes. No schema changes. No new dependencies.**
