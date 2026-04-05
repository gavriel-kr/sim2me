# ADD — Security Phase 3: Architectural Design

## Alignment with Project Architecture
All changes follow existing patterns:
- Rate limiting via existing `checkRateLimit` / `getClientIp` in `src/lib/rateLimit.ts`
- Security headers via `next.config.mjs` `headers()` function (already partially used)
- No new files, no schema changes, no new dependencies

---

## C1 — npm audit fix

Run `npm audit fix` to auto-resolve non-breaking vulnerabilities.
Manually review any that require `--force` (breaking changes).
The Next.js DoS vulnerabilities likely require upgrading Next.js version —
check if a patched version is available and test locally before deploying.

---

## H1 — Security Headers in next.config.mjs

Add a global `source: '/(.*)'` header block to the existing `headers()` array:

```js
{
  source: '/(.*)',
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sandbox-buy.paddle.com https://buy.paddle.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://flagcdn.com",
        "connect-src 'self' https://sandbox-buy.paddle.com https://buy.paddle.com",
        "frame-src https://sandbox-buy.paddle.com https://buy.paddle.com",
        "font-src 'self' data:",
      ].join('; '),
    },
  ],
},
```

**Note on CSP**: `'unsafe-inline'` and `'unsafe-eval'` are needed for Paddle's overlay and
Next.js hydration. This is acceptable for now; can be tightened with nonces in a future pass.
**Critically**, the `frame-ancestors` directive in CSP supersedes `X-Frame-Options`.
Both are included for older browser compatibility.

---

## H2 — Admin Login Rate Limiting

NextAuth's internal handler (`/api/auth/[...nextauth]`) is not a standard route.ts we can
wrap directly. The approach:

**Option A (preferred):** Create a custom middleware-level rate limiter that checks requests
to `/api/auth/callback/credentials` and rejects if over limit before NextAuth processes them.

Actually, the cleaner approach for Next.js App Router is to use the NextAuth `authorize`
callback — add the rate check there since we already control `src/lib/auth.ts`:

```typescript
// In authOptions credentials provider authorize():
async authorize(credentials) {
  const ip = /* get from headers() */ headers().get('x-forwarded-for') ?? 'unknown';
  const allowed = await checkRateLimit(ip.split(',')[0].trim(), 'admin-login', 10, 60);
  if (!allowed) return null; // NextAuth converts null → CredentialsSignin error
  // ... rest of authorize
}
```

`headers()` from `next/headers` is available in NextAuth's authorize callback in App Router.

**Impact**: Admin login: 10 attempts per minute per IP → lockout.

---

## H3 — Rate Limit Password Endpoints

**Files:**
- `src/app/api/account/forgot-password/route.ts` → 3 per 15 minutes per IP
- `src/app/api/account/reset-password/route.ts` → 5 per 15 minutes per IP
- `src/app/api/account/change-password/route.ts` → 5 per 60 seconds per IP

Pattern (already in use across the codebase):
```typescript
const ip = getClientIp(request);
const allowed = await checkRateLimit(ip, 'forgot-password', 3, 900);
if (!allowed) return NextResponse.json({ error: 'Too many requests...' }, { status: 429 });
```

---

## M1 — Retry Endpoint Rate Limiting

**File:** `src/app/api/account/orders/[id]/retry/route.ts`
Limit: **3 retries per order per hour** (by IP).

Pattern: same as above.

---

## M3 — Remove ignoreBuildErrors

**File:** `next.config.mjs`
```js
// Remove these:
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

**Risk**: The build may fail on existing TypeScript errors. Need to run `tsc --noEmit`
locally first and fix any errors before removing this flag.

---

## M4 — Password Strength

**Files:** `src/lib/validation/schemas.ts` (registerSchema, resetPasswordSchema),
`src/app/api/account/change-password/route.ts`

Strengthen the password regex:
```typescript
password: z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
```

**Risk**: Existing users are unaffected (passwords already set). Only affects new
registrations, password resets, and password changes.

---

## Verification Checklist
- [ ] `npm audit` shows 0 critical, 0 high
- [ ] `curl -I https://www.sim2me.net` shows `X-Frame-Options`, `X-Content-Type-Options`, etc.
- [ ] 11+ admin login attempts from same IP → rejected
- [ ] 4+ forgot-password requests in 15 min → 429
- [ ] 4+ reset-password attempts in 15 min → 429
- [ ] 6+ retry attempts → 429
- [ ] `tsc --noEmit` passes with 0 errors
- [ ] Password "password1" rejected at registration (no uppercase)
