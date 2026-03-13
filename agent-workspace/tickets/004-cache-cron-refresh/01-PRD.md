# PRD — Ticket 004: Automatic Package Cache Refresh (Cron + Admin UI)

## Problem
The public destinations page (`/destinations`) relies on a DB cache of eSIMaccess packages.
This cache is only populated when:
1. An admin manually clicks "Refresh Package Cache"
2. An admin visits the packages page and clicks "Refresh"

If the cache is empty and `getPackages('')` fails (common — eSIMaccess returns "system busy"),
the page falls back to seed data: ~62 destinations instead of 176+.

## Goal
Ensure the DB cache is always fresh without manual intervention.

## Requirements

### R1 — Automatic Cron Refresh (every 3 hours)
- Vercel Cron Job triggers every 3 hours
- Calls a protected API endpoint that fetches all packages and updates the DB cache
- If eSIMaccess is busy, retries are handled by existing `getPackages` logic
- No admin action needed

### R2 — Cache Status Panel in Admin UI
- Replace current `RefreshCacheButton` with `CacheStatusPanel`
- Shows: last updated time (e.g. "Updated 2 hours ago")
- Shows: next auto-refresh time (e.g. "Next refresh in 1h")
- Shows: package count cached
- Manual "Refresh Now" button still available for emergencies

### R3 — Cache Status API
- New `GET /api/admin/packages/cache-status` endpoint
- Returns `{ ts: number, count: number }` from DB (reads SiteSetting row)
- Admin-authenticated

## Out of Scope
- Changing the caching strategy (stale-while-revalidate already implemented)
- Any changes to the public `/api/packages` route
