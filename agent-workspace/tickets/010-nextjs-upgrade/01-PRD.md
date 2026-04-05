# PRD — Next.js Security Upgrade (14 → 15.5.14)

## Context
Current: Next.js 14.2.35
Target: Next.js 15.5.14 (security backport tag)

## Why NOT Next.js 16
Next.js 16.2.2 is the latest, but introduces React 19 as mandatory + additional
breaking changes we don't need yet. The `backport` channel (15.5.14) closes
all 3 CVEs without requiring React 19 or additional breaking changes.

## CVEs Being Fixed
1. **GHSA-9g9p-9gw9-jx7f** — DoS via Image Optimizer remotePatterns (HIGH)
   - Affects our `remotePatterns` config in next.config.mjs
2. **GHSA-h25m-26qc-wcjf** — HTTP request deserialization DoS via RSC (HIGH)
3. **GHSA-ggv3-7p47-pfv8** — HTTP request smuggling in rewrites (HIGH)
   - Affects our favicon.ico rewrite rule

## Breaking Changes Assessment (14 → 15)
The main Next.js 15 breaking change is async Request APIs:
- `params` → must be `Promise<{...}>` and awaited
- `searchParams` → must be `Promise<{...}>` and awaited
- `cookies()`, `headers()` → must be awaited

### Pre-existing compliance (already async):
- All [locale] pages: already use `await params` ✓
- `headers()`: already awaited in layout.tsx, auth.ts, destinations ✓
- `cookies()`: not used in codebase ✓

### Only fix needed:
- `src/app/admin/audit-log/page.tsx`: searchParams not typed as Promise ✗

## Scope
1. Fix `audit-log/page.tsx` searchParams to async pattern
2. Upgrade next to 15.5.14
3. Run `npm audit fix` for dev-dep vulnerabilities (glob, minimatch, eslint-config-next)
4. Verify build passes
5. Smoke test
