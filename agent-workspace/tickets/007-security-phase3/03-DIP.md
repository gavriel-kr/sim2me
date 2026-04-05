# DIP — Security Phase 3: Detailed Implementation Plan

---

## Phase 1 — CRITICAL: npm audit fix

### Step 1.1 — Run audit and fix non-breaking
- [ ] Run `npm audit fix` (fixes automatically without breaking changes)
- [ ] Review output — note which vulnerabilities remain

### Step 1.2 — Upgrade Next.js if DoS patch available
- [ ] Check `npm outdated next` — compare current vs latest patched version
- [ ] If patch available: `npm install next@<version>` and run build test
- [ ] Verify `npm audit` output after upgrade

### Step 1.3 — Verify build still works
- [ ] `npm run build` succeeds
- [ ] `npm audit` shows 0 critical, 0 high

---

## Phase 2 — HIGH: Security Headers

### Step 2.1 — Add headers to next.config.mjs
- [ ] Add global `source: '/(.*)'` header block with:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Content-Security-Policy` (see ADD for full value)

### Step 2.2 — Verify headers locally
- [ ] `npm run build && npm run start` → curl or browser devtools → confirm headers present
- [ ] Verify Paddle checkout overlay still works (CSP allows paddle domains)

---

## Phase 3 — HIGH: Admin Login Rate Limiting

### Step 3.1 — Add rate limit in auth.ts authorize callback
- [ ] Import `headers` from `next/headers` in `src/lib/auth.ts`
- [ ] Import `checkRateLimit` from `@/lib/rateLimit`
- [ ] Add rate check (10/60s per IP) at start of admin `authorize()` function

### Step 3.2 — Verify
- [ ] Send 11 failed login attempts from same IP → 11th attempt fails (NextAuth error page)

---

## Phase 4 — HIGH: Rate Limit Password Endpoints (3 files)

### Step 4.1 — forgot-password (3 per 15 min)
- [ ] `src/app/api/account/forgot-password/route.ts`: add `checkRateLimit(ip, 'forgot-password', 3, 900)`

### Step 4.2 — reset-password (5 per 15 min)
- [ ] `src/app/api/account/reset-password/route.ts`: add `checkRateLimit(ip, 'reset-password', 5, 900)`

### Step 4.3 — change-password (5 per 60 sec)
- [ ] `src/app/api/account/change-password/route.ts`: add `checkRateLimit(ip, 'change-password', 5, 60)`

---

## Phase 5 — MEDIUM: Retry Endpoint Rate Limiting

### Step 5.1 — Add rate limit
- [ ] `src/app/api/account/orders/[id]/retry/route.ts`: add `checkRateLimit(ip, 'order-retry', 3, 3600)`
  (3 retries per hour per IP)

---

## Phase 6 — MEDIUM: Remove ignoreBuildErrors

### Step 6.1 — Run TypeScript check first
- [ ] `npx tsc --noEmit` → review all errors
- [ ] Fix TypeScript errors (or suppress with proper `// @ts-expect-error` where truly needed)
- [ ] Run ESLint: `npx next lint` → fix critical errors

### Step 6.2 — Remove flags from next.config.mjs
- [ ] Remove `typescript: { ignoreBuildErrors: true }`
- [ ] Remove `eslint: { ignoreDuringBuilds: true }`
- [ ] Run `npm run build` → must succeed with 0 errors

---

## Phase 7 — MEDIUM: Password Strength

### Step 7.1 — Update schemas
- [ ] `src/lib/validation/schemas.ts`: strengthen `registerSchema` password field
- [ ] `src/lib/validation/schemas.ts`: strengthen `resetPasswordSchema` password field
- [ ] `src/app/api/account/change-password/route.ts`: strengthen local schema password field
- [ ] Run linter → 0 errors

### Step 7.2 — Frontend validation (optional, cosmetic)
- [ ] Check if registration/reset forms show helpful error messages for strength requirements

---

## Phase 8 — Final Verification & Commit

- [ ] `npm audit` → 0 critical, 0 high
- [ ] Browser devtools → confirm all security headers present on sim2me.net pages
- [ ] Test admin login rate limiting
- [ ] Test forgot-password rate limiting
- [ ] Test weak password rejection
- [ ] Run linter on all modified files
- [ ] Commit and push
- [ ] Update CHANGELOG / MEMORY

---

## Files to Modify (estimated 9 files + next.config.mjs)

| File | Change |
|------|--------|
| `next.config.mjs` | Security headers + remove ignoreBuildErrors |
| `src/lib/auth.ts` | Rate limit admin login in authorize() |
| `src/lib/validation/schemas.ts` | Password strength (2 fields) |
| `src/app/api/account/forgot-password/route.ts` | Rate limit |
| `src/app/api/account/reset-password/route.ts` | Rate limit |
| `src/app/api/account/change-password/route.ts` | Rate limit + password strength |
| `src/app/api/account/orders/[id]/retry/route.ts` | Rate limit |
| `package.json` / `package-lock.json` | npm audit fix + Next.js upgrade |

---

## Deferred to Ticket 008 (architectural, higher effort)

| Issue | Reason deferred |
|-------|-----------------|
| Session invalidation on password change | Requires JWT blocklist or session DB |
| Email verification on registration | New email flow, Resend templates needed |
| 2FA for admin | New auth flow, TOTP library needed |
| Admin audit log | New DB table, new UI |
| SPF/DKIM/DMARC | DNS-level, needs domain access |
| .env.example + gitignore audit | Minor housekeeping |
