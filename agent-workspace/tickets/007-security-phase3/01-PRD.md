# PRD — Security Phase 3: Complete Security Hardening

## Context
After two rounds of security hardening (tickets 005 and 006), the following have been resolved:
- ✅ Server-side price validation
- ✅ requireAdmin() on all 17 admin routes
- ✅ Admin purchase notification emails
- ✅ Remove debug artifacts
- ✅ Rate limiting on 5 public endpoints
- ✅ Webhook fraud detection (payment < supplier cost)
- ✅ Block guest account takeover
- ✅ Remove wholesalePrice from public API
- ✅ HTML escape in contact form email
- ✅ Rate limiter DB error observability

This ticket consolidates **all remaining security issues** identified in the full audit.

---

## Remaining Issues — Prioritized

### 🔴 CRITICAL

**C1 — npm audit: 1 critical, 9 high vulnerabilities in dependencies**
Running `npm audit` reveals 16 vulnerabilities including:
- **1 Critical**: Known CVE in a dependency
- **9 High**: Including Next.js DoS via Server Actions (`GHSA-7m27-7ghc-44w9`) and
  Next.js DoS via Server Components (`GHSA-5j59-xgg2-r9c4`)
- **2 Moderate**, **4 Low**

Action: `npm audit fix` (non-breaking) + review what `--force` changes.

---

### 🔴 HIGH

**H1 — No HTTP security headers**
`next.config.mjs` has zero security headers. The app is missing:
- `X-Frame-Options: DENY` — clickjacking
- `X-Content-Type-Options: nosniff` — MIME sniffing
- `Content-Security-Policy` — XSS mitigation
- `Strict-Transport-Security` — force HTTPS (HSTS)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — restrict camera, microphone, geolocation

**H2 — Admin login (NextAuth) has no rate limiting**
`POST /api/auth/callback/credentials` handles admin login but goes through NextAuth's
internal handler — no rate limiting exists. An attacker can brute-force admin passwords
at full speed. The `/api/auth/token` (customer token) IS rate-limited, but admin login is not.

**H3 — No rate limiting on forgot-password and reset-password**
- `POST /api/account/forgot-password` — unlimited email spam to any address
- `POST /api/account/reset-password` — token brute-force possible (32-byte hex, safe,
  but no lockout after failed attempts)
- `POST /api/account/change-password` — unlimited password-change attempts on logged-in account

---

### 🟠 MEDIUM

**M1 — Retry endpoint has no rate limiting**
`POST /api/account/orders/[id]/retry` — a customer with a FAILED order can spam this
without limit. Each call triggers a real eSIM purchase from eSIMaccess, costing real money.

**M2 — Session does not invalidate on password change**
When a customer changes their password (via `/api/account/change-password`), existing JWT
sessions remain valid for up to 7 days. If a session was stolen, changing the password does
not revoke access.

**M3 — TypeScript and ESLint ignored in builds**
```js
// next.config.mjs — current state
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```
Security-relevant type errors are silently deployed to production.

**M4 — Password strength: only minimum 8 chars**
Both `registerSchema` and `change-password` schema accept any 8-character string (e.g. "password").
No uppercase/number/symbol requirement. Admin passwords use the same weak validation.

**M5 — No email verification on registration**
Users register with any email (including someone else's) and immediately gain access.
No confirmation link is sent. Enables registration with fake/stolen emails.

---

### 🟡 LOW-MEDIUM

**L1 — No 2FA for admin accounts**
Admin login has a single factor (password). If phished or leaked, the attacker has
full admin access with no second barrier.

**L2 — No admin action audit log**
There is no record of who did what in the admin panel (deleted article, changed settings,
updated prices). Makes forensics after an incident impossible.

**L3 — `.env` file exists locally but has never been committed to git**
Confirmed safe (zero git history). Recommend: verify `.env` is in `.gitignore` and add
a `.env.example` template so contributors don't accidentally commit secrets.

---

### 🔵 NON-CODE

**N1 — SPF / DKIM / DMARC**
Verify that `sim2me.net` DNS records include proper email authentication to prevent
spoofing of `@sim2me.net` addresses.

**N2 — Vercel environment variable access**
Confirm only necessary team members have access to Vercel project (which exposes all env vars).

---

## Implementation Priority

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | npm audit fix | Critical | Low |
| 2 | Security headers in next.config.mjs | High | Low |
| 3 | Rate limit admin login | High | Medium |
| 4 | Rate limit forgot/reset/change-password | High | Low |
| 5 | Rate limit retry endpoint | Medium | Low |
| 6 | Remove ignoreBuildErrors | Medium | Low |
| 7 | Password strength validation | Medium | Low |
| 8 | Session invalidation on password change | Medium | Medium |
| 9 | Email verification on registration | Medium | High |
| 10 | 2FA for admin | Low-Med | High |
| 11 | Admin audit log | Low | High |
| 12 | .env.example + gitignore check | Low | Low |

Items 1–7 are in scope for this ticket (low-medium effort, high impact).
Items 8–12 require architectural discussion and are deferred to ticket 008.

---

## Success Criteria
- `npm audit` shows 0 critical and 0 high vulnerabilities
- All page responses include `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`
- Repeated admin login failures are rate-limited
- Forgot/reset/change-password are rate-limited
- Retry endpoint is rate-limited
- Build fails on TypeScript errors
- Passwords require at least one number and one uppercase letter
