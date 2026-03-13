# DIP — Ticket 004: Automatic Package Cache Refresh

## Status Legend: [ ] pending · [✅] done

---

## Phase 1 — Shared Cache Helper

- [ ] **1.1** Create `src/lib/packagesCache.ts`
  - Move `setDbCachedPackages` logic here (strips `locationNetworkList`, upserts SiteSetting)
  - Export: `setDbCachedPackages(packageList: EsimPackage[]): void`
  - Export constant: `ALL_PACKAGES_DB_CACHE_KEY = 'packages_all_cache'`

- [ ] **1.2** Update `src/app/api/packages/route.ts`
  - Remove inline `setDbCachedPackages` + `ALL_PACKAGES_DB_CACHE_KEY`
  - Import from `@/lib/packagesCache`

- [ ] **1.3** Update `src/app/api/admin/packages/refresh-cache/route.ts`
  - Remove inline duplicate of `setDbCachedPackages`
  - Import from `@/lib/packagesCache`

---

## Phase 2 — Cron Endpoint

- [ ] **2.1** Create `src/app/api/cron/refresh-packages/route.ts`
  - GET handler
  - Auth: check `Authorization` header equals `Bearer ${process.env.CRON_SECRET}`
  - Call `getPackages('')`, if `packageList.length >= 500` call `setDbCachedPackages`
  - Return `{ ok: true, count: N }` or `{ error }` with appropriate status

- [ ] **2.2** Create `vercel.json` in project root
  - Cron: `GET /api/cron/refresh-packages` every 3 hours (`0 */3 * * *`)

---

## Phase 3 — Cache Status API

- [ ] **3.1** Create `src/app/api/admin/packages/cache-status/route.ts`
  - GET handler, admin session required
  - Read `SiteSetting` where `key = 'packages_all_cache'`
  - Parse JSON value, extract `{ ts, packageList.length }`
  - Return `{ ts: number | null, count: number }`

---

## Phase 4 — Admin UI Update

- [ ] **4.1** Update `src/app/admin/packages/RefreshCacheButton.tsx`
  - On mount: fetch `GET /api/admin/packages/cache-status`
  - Show last updated time using `date-fns` `formatDistanceToNow`
  - Show next refresh countdown: `3h - elapsed`
  - Show package count
  - After manual refresh: re-fetch status

---

## Phase 5 — Verify & Deploy

- [ ] **5.1** Test locally: hit `/api/cron/refresh-packages` with `Authorization: Bearer test`
  - Confirm DB cache updated
- [ ] **5.2** Test admin UI: verify timer shows correct last-updated and next-refresh
- [ ] **5.3** Push to Vercel, confirm cron appears in Vercel dashboard under "Cron Jobs"
- [ ] **5.4** Verify `CRON_SECRET` env var set in Vercel (check dashboard)

---

## Files Modified
1. `src/lib/packagesCache.ts` ← new
2. `src/app/api/cron/refresh-packages/route.ts` ← new
3. `src/app/api/admin/packages/cache-status/route.ts` ← new
4. `vercel.json` ← new
5. `src/app/api/packages/route.ts` ← updated (import from shared lib)
6. `src/app/api/admin/packages/refresh-cache/route.ts` ← updated (import from shared lib)
7. `src/app/admin/packages/RefreshCacheButton.tsx` ← updated (status display)
