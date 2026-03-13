# ADD — Ticket 004: Automatic Package Cache Refresh

## Architecture Overview

Three small, independent additions following existing patterns. Zero new dependencies.

---

## R1 — Vercel Cron Job

### `vercel.json` (new file in project root)
```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-packages",
      "schedule": "0 */3 * * *"
    }
  ]
}
```
Runs every 3 hours (at :00 of hours 0, 3, 6, 9, 12, 15, 18, 21 UTC).

### `src/app/api/cron/refresh-packages/route.ts` (new)
- **Method**: GET (Vercel Cron always uses GET)
- **Auth**: Vercel sends `Authorization: Bearer <CRON_SECRET>` header automatically.
  Validate via `process.env.CRON_SECRET`.
- **Logic**:
  1. Check auth header
  2. Call `getPackages('')` with existing retry/timeout logic
  3. If `packageList.length >= 500`, call `setDbCachedPackages(packageList)` (existing helper — but needs to be exported from route.ts or extracted to a shared lib)
  4. Return `{ ok: true, count: N }` or error

### Shared cache helper
Extract `setDbCachedPackages` from `src/app/api/packages/route.ts` into
`src/lib/packagesCache.ts` so both the public route and cron route can use it.

---

## R2 — Cache Status API

### `src/app/api/admin/packages/cache-status/route.ts` (new)
- **Method**: GET
- **Auth**: `getServerSession(authOptions)` — admin required
- **Logic**: Read `SiteSetting` row with key `packages_all_cache`, parse JSON, return `{ ts, count }`
- **Response**: `{ ts: number, count: number }` or `{ ts: null, count: 0 }` if missing

---

## R3 — Admin UI: CacheStatusPanel

### `src/app/admin/packages/RefreshCacheButton.tsx` (update in place)
Rename component to `CacheStatusPanel` (file stays the same name for minimal diff).

**State**:
- `status: { ts: number; count: number } | null` — loaded on mount
- `loading: boolean` — for manual refresh
- `result: string | null` — success/error message

**On mount**: fetch `GET /api/admin/packages/cache-status` to get `{ ts, count }`.

**Display**:
```
[ ↻ Refresh Package Cache ]
✓ 2,448 packages · Updated 2h ago · Next refresh in ~1h
```

**Timer logic** (client-side, no extra state):
- `lastUpdated`: pure JS — `Math.floor((Date.now() - ts) / 60000)` → "X min ago" / "Xh ago"
- `nextRefresh`: `Math.max(0, 180 - Math.floor((Date.now() - ts) / 60000))` minutes remaining

After manual refresh: re-fetch status to update display.

---

## Files Touched

| File | Change |
|------|--------|
| `vercel.json` | New — cron config |
| `src/lib/packagesCache.ts` | New — shared `setDbCachedPackages` helper |
| `src/app/api/cron/refresh-packages/route.ts` | New — cron endpoint |
| `src/app/api/admin/packages/cache-status/route.ts` | New — status endpoint |
| `src/app/api/packages/route.ts` | Update — import `setDbCachedPackages` from shared lib |
| `src/app/admin/packages/RefreshCacheButton.tsx` | Update — add status display |

Total: 4 new files, 2 updated files. No schema changes. **No new npm dependencies** (time formatting via pure JS).

---

## Environment Variables Required
- `CRON_SECRET` — set in Vercel dashboard (auto-provided by Vercel for cron jobs)

---

## Rollback
Remove `vercel.json` to disable cron. All other changes are additive.
