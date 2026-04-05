# PRD — Ticket 012: Cloudflare Turnstile Bot Protection

## Background
The checkout and customer login flows are currently unprotected against automated bot attacks. A bot could:
- Spam the checkout API to enumerate valid packages or abuse rate limits
- Run credential-stuffing attacks against the login endpoint
- Automate fraudulent purchase attempts

## Goal
Add Cloudflare Turnstile — an invisible, privacy-respecting bot challenge — to:
1. **Checkout** — before the "Pay" button submits to `/api/checkout/create-transaction`
2. **Customer Login** — before credentials are submitted via NextAuth

## Why Turnstile (not reCAPTCHA)
- Already on Cloudflare CDN (site uses `cloudflareinsights.com`)
- Invisible to real users in the vast majority of cases — no "I'm not a robot" checkbox
- Privacy-respecting: does not track users for advertising
- Free, no usage limits for normal traffic
- GDPR-compliant out of the box

## User Experience
- **Typical real user:** sees nothing — Turnstile validates silently in the background
- **Suspected bot:** may see a one-click challenge ("I'm human" checkbox)
- **Failed challenge:** shows a friendly error message; user can retry

## Technical Requirements
1. Cloudflare Turnstile site key + secret key (from Cloudflare dashboard)
2. Environment variables: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
3. No new npm packages — Turnstile loads via CDN script tag
4. Server-side token verification before any purchase or login is processed
5. CSP headers updated to allow `challenges.cloudflare.com`

## Success Criteria
- Checkout page shows Turnstile widget; Pay button disabled until Turnstile verifies
- Login page validates Turnstile token before calling `signIn`
- Server rejects any request without a valid Turnstile token (400 / 401)
- Existing functionality (normal checkout, normal login) works unchanged
- No visible disruption to legitimate users
