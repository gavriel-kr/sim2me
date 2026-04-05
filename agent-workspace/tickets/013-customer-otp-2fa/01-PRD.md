# PRD — Ticket 013: Customer OTP 2FA (SMS / Email)

## Background
Currently customers can log in with email + password only. While Turnstile protects against bots and
email verification protects against fake accounts, there is no second factor protecting
legitimate accounts from credential theft (phishing, password breaches, data leaks).

Admins already have TOTP 2FA (Ticket 008). This ticket brings equivalent protection to customers,
but uses time-limited OTP codes sent via **Email** or **SMS** — which is simpler for
non-technical users than installing an authenticator app.

## Decision: SMS + Email (dual channel)
- **Email OTP**: via existing Resend infrastructure — zero additional cost
- **SMS OTP**: via Twilio Verify API — industry standard, ~$0.05/verification
- Customer chooses their preferred channel in account settings
- **Completely optional** — existing customers are unaffected

## User Experience

### Enabling 2FA (account settings → Security tab)
1. Customer goes to Account → Security
2. Clicks "Enable 2-Step Verification"
3. Chooses: Email or SMS (if phone on file)
4. Receives a test code to confirm setup works
5. Enters code → 2FA enabled

### Login with 2FA enabled
1. Customer enters email + password (+ Turnstile)
2. Server validates credentials → sends OTP → returns `OTP_REQUIRED` error
3. Login page shows "Enter the code we sent to your email/phone"
4. Customer enters 6-digit code
5. Server verifies → creates session

### Disabling 2FA
1. Customer enters current password + current OTP code
2. 2FA disabled

## Security Requirements
1. **Codes are 6-digit numeric, randomly generated**
2. **Server-side only**: code is never sent to client, never stored in plain text
3. **Hashed storage**: SHA-256 hash of code stored in DB
4. **10-minute expiry** (email), 5-minute expiry (SMS)
5. **Max 5 failed attempts** before code is invalidated → must request new code
6. **Max 3 sends** per 10-minute window per IP (rate limit)
7. **Single-use**: code invalidated immediately after first successful verification
8. **No enumeration**: same response whether user exists or has 2FA enabled
9. **Backup**: if code expired/lost, customer can resend; SMS customers can fall back to email

## Out of Scope (Ticket 013)
- Backup recovery codes (deferred)
- "Remember this device for 30 days" (deferred)
- Google/Apple passkeys (separate feature)
