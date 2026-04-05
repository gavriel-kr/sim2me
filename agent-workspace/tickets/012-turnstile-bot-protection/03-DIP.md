# DIP — Ticket 012: Cloudflare Turnstile Bot Protection

## Prerequisites (must do BEFORE starting implementation)
- [ ] Create Turnstile site in Cloudflare Dashboard:
  1. Go to https://dash.cloudflare.com → Turnstile → Add Site
  2. Domain: `sim2me.net`
  3. Widget type: **Managed** (invisible by default, challenge only if suspicious)
  4. Copy **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  5. Copy **Secret Key** → `TURNSTILE_SECRET_KEY`
- [ ] Add both env vars to Vercel project settings (Settings → Environment Variables)
- [ ] Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to local `.env.local` for development

---

## Phase 1 — Server-side utility ✅
- [ ] Create `src/lib/turnstile.ts`
  - `verifyTurnstile(token: string, ip?: string): Promise<boolean>`
  - Calls `https://challenges.cloudflare.com/turnstile/v0/siteverify`
  - Returns `false` if `TURNSTILE_SECRET_KEY` not set (dev bypass)
  - Returns `false` on any error (fail-closed)

## Phase 2 — Turnstile widget component ✅
- [ ] Create `src/components/ui/TurnstileWidget.tsx`
  - Loads CDN script once per page
  - Renders Turnstile widget with site key from env
  - Callbacks: `onVerify`, `onExpire`, `onError`
  - If no site key → renders nothing (silent bypass for dev)

## Phase 3 — CSP update ✅
- [ ] Edit `next.config.mjs`:
  - Add `https://challenges.cloudflare.com` to `script-src`
  - Add `https://challenges.cloudflare.com` to `frame-src`
  - Add `https://challenges.cloudflare.com` to `connect-src`

## Phase 4 — Checkout integration ✅
- [ ] Edit `src/app/[locale]/checkout/CheckoutClient.tsx`:
  - Add `turnstileToken` state
  - Render `<TurnstileWidget>` at the payment step
  - Disable "Pay Now" button when `turnstileToken` is empty
  - Include `turnstileToken` in the fetch body to `create-transaction`
  - Reset Turnstile after each attempt
- [ ] Edit `src/app/api/checkout/create-transaction/route.ts`:
  - Extract `turnstileToken` from body
  - Call `verifyTurnstile(token, ip)` before business logic
  - Return 400 if invalid

## Phase 5 — Login integration ✅
- [ ] Create `src/app/api/account/verify-turnstile/route.ts`
  - POST endpoint: `{ token: string }` → `{ ok: true }` or `{ error }`
  - Calls `verifyTurnstile(token, ip)`
  - Rate limited (5 attempts / minute)
- [ ] Edit `src/app/[locale]/account/login/AccountLoginClient.tsx`:
  - Add `turnstileToken` state
  - Render `<TurnstileWidget>` below the form
  - On submit: first POST to `/api/account/verify-turnstile`
  - If verified → call `signIn`; if not → show error + reset widget

## Phase 6 — Verify & Deploy ✅
- [ ] Local test: checkout flow with Turnstile (use Cloudflare test keys for dev)
- [ ] Local test: login flow with Turnstile
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `next build` → exits 0
- [ ] Deploy to Vercel
- [ ] Live test on sim2me.net

---

## Cloudflare Test Keys (for development without real keys)
Cloudflare provides special test keys that always pass:
- **Site Key**: `1x00000000000000000000AA`
- **Secret Key**: `1x0000000000000000000000000000000AA`

Use these in `.env.local` to test the full flow locally without a real Cloudflare account.
