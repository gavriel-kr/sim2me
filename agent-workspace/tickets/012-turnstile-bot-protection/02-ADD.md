# ADD — Ticket 012: Cloudflare Turnstile Bot Protection

## Architecture Principles Applied
- **No new npm dependencies** — Turnstile loads from CDN
- **Minimal footprint** — one shared hook/component, two integration points
- **Server-side validation is authoritative** — client token is never trusted alone
- **Fail gracefully** — if Turnstile script fails to load, show error; never silently bypass

## Component Architecture

### New: `src/lib/turnstile.ts`
Server-side utility to verify a Turnstile response token:
```typescript
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean>
```
- POSTs to `https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Uses `TURNSTILE_SECRET_KEY` env var
- Returns `true` if `success === true` in the response
- Returns `false` on network errors (fail-closed for security)

### New: `src/components/ui/TurnstileWidget.tsx`
Client component that renders the Turnstile widget:
- Props: `onVerify(token: string)`, `onExpire()`, `onError()`
- Loads `https://challenges.cloudflare.com/turnstile/v0/api.js` once (deferred)
- Uses `NEXT_PUBLIC_TURNSTILE_SITE_KEY` env var
- Exposes a `reset()` method via ref for post-error retry
- Theme: matches site (light/system)

## Integration Points

### 1. Checkout — `CheckoutClient.tsx`
**Flow:**
1. User fills traveler form → clicks "Continue to Payment"
2. Turnstile widget renders at the payment step (invisible by default)
3. Turnstile auto-validates → sets `turnstileToken` state
4. "Pay Now" button is enabled only when `turnstileToken` is set
5. Token is sent in the POST body to `/api/checkout/create-transaction`
6. After payment attempt (success or error), Turnstile resets

**Server side — `create-transaction/route.ts`:**
- Extracts `turnstileToken` from request body
- Calls `verifyTurnstile(token, clientIp)` before any business logic
- Returns `{ error: 'Bot check failed. Please try again.' }` (400) if invalid

### 2. Login — `AccountLoginClient.tsx`
**Flow:**
1. User sees login form — Turnstile widget renders (invisible)
2. Turnstile auto-validates → sets `turnstileToken` state
3. On submit: sends `turnstileToken` to `/api/account/verify-turnstile` first
4. Only if verified → calls `signIn('credentials-customer', ...)`
5. On error/expired, Turnstile resets and user can try again

**Alternative approach (simpler):** Verify token in a new lightweight endpoint
`/api/account/verify-turnstile` → returns `{ ok: true }` or `{ error }`.
This keeps NextAuth's authorize callback clean.

## CSP Changes — `next.config.mjs`
Add `https://challenges.cloudflare.com` to:
- `script-src` — loads the Turnstile JS
- `frame-src` — Turnstile renders in an iframe
- `connect-src` — Turnstile communicates with Cloudflare

## Environment Variables Required
| Variable | Where | Description |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Vercel + `.env.local` | Public key for the widget |
| `TURNSTILE_SECRET_KEY` | Vercel only | Private key for server verification |

Both obtained from: Cloudflare Dashboard → Turnstile → Add Site

## Files Modified/Created
| File | Type | Change |
|---|---|---|
| `src/lib/turnstile.ts` | New | Server-side verification utility |
| `src/components/ui/TurnstileWidget.tsx` | New | Client widget component |
| `src/app/[locale]/checkout/CheckoutClient.tsx` | Modified | Add widget + token to payload |
| `src/app/api/checkout/create-transaction/route.ts` | Modified | Verify token server-side |
| `src/app/[locale]/account/login/AccountLoginClient.tsx` | Modified | Add widget + pre-verify |
| `src/app/api/account/verify-turnstile/route.ts` | New | Lightweight verify endpoint for login |
| `next.config.mjs` | Modified | Expand CSP for Turnstile domains |

## Risk Assessment
- **Low**: No schema changes, no database changes
- **Low**: No new npm packages
- **Medium**: If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set in Vercel, widget won't render → must add env vars before deploying
- **Mitigation**: Widget gracefully shows error if env var missing; checkout/login still functional in dev without key (skip verification when key is absent)
