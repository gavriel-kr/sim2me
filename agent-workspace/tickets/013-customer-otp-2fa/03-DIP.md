# DIP — Ticket 013: Customer OTP 2FA (SMS / Email)

## Pre-Implementation Checklist
- [x] PRD approved
- [x] ADD reviewed against architecture.md patterns
- [x] All existing Customer auth code read (auth.ts, login page, AccountClient)
- [x] Admin TOTP pattern understood (Ticket 008)
- [x] Twilio Verify vs custom — decision: **Twilio for SMS, custom SHA-256 for email**
- [ ] **User must add Twilio env vars to Vercel BEFORE SMS feature goes live**
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_VERIFY_SERVICE_SID`

---

## Phase 1 — Database Schema

### Step 1.1 — Add OTP fields to Customer model
- [ ] Edit `prisma/schema.prisma`: add `otpEnabled`, `otpMethod`, `otpCodeHash`, `otpCodeExpires`, `otpAttempts`
- [ ] Run `npx prisma db push` to apply schema (non-destructive, additive only)
- [ ] Verify with `npx prisma studio` or quick query

---

## Phase 2 — Server Library

### Step 2.1 — Create `src/lib/otp.ts`
- [ ] `generateOtpCode()` — crypto.randomInt(100000, 999999), returns string
- [ ] `hashOtpCode(code)` — SHA-256 hex digest
- [ ] `sendOtpViaTwilio(phone, code)` — Twilio Verify check (SMS path)
  - Graceful fallback: if no Twilio env vars → return `{ ok: false, reason: 'not_configured' }`
- [ ] `verifyOtpViaTwilio(phone, code)` — Twilio Verify check
- [ ] Export types

### Step 2.2 — Add `sendOtpEmail()` to `src/lib/email.ts`
- [ ] 6-digit code, 10 min expiry, clean HTML template (bilingual HE/EN)
- [ ] Subject: "Your Sim2Me login code / קוד הכניסה שלך ל-Sim2Me"

---

## Phase 3 — Auth Flow

### Step 3.1 — Modify `src/lib/auth.ts` (credentials-customer provider)
- [ ] Add `otpCode` field to credentials declaration
- [ ] After email+password validation + emailVerified check:
  - If `customer.otpEnabled`:
    - If no `otpCode` in credentials → generate, hash, save, send → throw `OTP_REQUIRED`
    - If `otpCode` present → verify (check expiry, attempts, hash) → clear code → return user
- [ ] Error codes: `OTP_REQUIRED`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_TOO_MANY_ATTEMPTS`

---

## Phase 4 — API Routes

### Step 4.1 — `POST /api/account/otp/resend`
- [ ] Body: `{ email }` (no password — uses active OTP session state)
- [ ] Rate limit: 3 per 10 min per IP (`checkRateLimit(ip, 'otp-resend', 3, 600)`)
- [ ] Find customer by email, check `otpEnabled`, regenerate + resend code
- [ ] Return: `{ ok: true }` or error (no enumeration)

### Step 4.2 — `POST /api/account/otp/enable`
- [ ] Requires auth session (`getSessionForRequest`)
- [ ] Body: `{ method: 'email' | 'sms', otpCode: string }`
- [ ] Verify the test code that was previously sent
- [ ] If valid: set `otpEnabled: true`, `otpMethod: method`, clear temp code
- [ ] Return: `{ ok: true }`

### Step 4.3 — `POST /api/account/otp/disable`
- [ ] Requires auth session
- [ ] Body: `{ password: string, otpCode: string }`
- [ ] Verify current password AND current OTP code
- [ ] If valid: set `otpEnabled: false`, `otpMethod: null`, clear code fields
- [ ] Return: `{ ok: true }`

### Step 4.4 — `POST /api/account/otp/send-setup`
- [ ] Requires auth session
- [ ] Body: `{ method: 'email' | 'sms' }`
- [ ] Sends a test code during setup flow (so user can verify delivery before enabling)
- [ ] Rate limited
- [ ] Return: `{ ok: true, channel: 'email' | 'sms' }`

---

## Phase 5 — Login UI

### Step 5.1 — Modify `AccountLoginClient.tsx`
- [ ] Add state: `step: 'credentials' | 'otp'` and `otpEmail` (email of user being verified)
- [ ] Add state: `otpCode: string`, `resendCooldown: number` (countdown seconds)
- [ ] On `OTP_REQUIRED` from signIn → set `step = 'otp'`
- [ ] Render step 1: existing credentials form (unchanged)
- [ ] Render step 2:
  - "We sent a 6-digit code to your email/phone"
  - 6-digit numeric input (maxLength=6, pattern=[0-9]*)
  - Submit "Verify Code" button
  - "Resend code" button (with 30-second cooldown)
  - "← Back" link (return to step 1)
- [ ] On verify: call `signIn('credentials-customer', { email, password, otpCode })`
- [ ] Handle `OTP_INVALID`, `OTP_EXPIRED`, `OTP_TOO_MANY_ATTEMPTS` error states

---

## Phase 6 — Account Settings UI

### Step 6.1 — Modify `AccountClient.tsx`
- [ ] Add 2FA section to Security tab (or existing Settings section)
- [ ] Show current status: "2-Step Verification: Enabled (Email)" or "Not enabled"
- [ ] If not enabled: "Enable 2-Step Verification" button
  - Opens inline panel:
    1. Method selector (Email always available; SMS only if phone on file)
    2. "Send test code" button → calls `/api/account/otp/send-setup`
    3. Code input field (6-digit)
    4. "Confirm & Enable" button → calls `/api/account/otp/enable`
- [ ] If enabled: "Disable 2-Step Verification" button
  - Opens inline panel:
    1. Password input
    2. "Send current code" button OR code auto-sent
    3. Code input
    4. "Confirm Disable" button → calls `/api/account/otp/disable`

---

## Phase 7 — Install Dependency & Env Vars

### Step 7.1 — Install Twilio SDK (SMS only)
- [ ] `npm install twilio` — adds ~3MB, well-maintained, zero CVEs
- [ ] Import only in `src/lib/otp.ts` (lazy import to avoid bundle bloat)
- [ ] Graceful degradation: if `TWILIO_*` env vars missing, SMS option hidden in UI

### Step 7.2 — Document env vars for user
- [ ] Provide instructions for creating Twilio Verify Service
- [ ] Add to `.env.example` or similar documentation

---

## Phase 8 — Build & Deploy

### Step 8.1 — TypeScript check
- [ ] `npx tsc --noEmit` — must return 0 errors

### Step 8.2 — Build check
- [ ] `npx next build` — must succeed cleanly

### Step 8.3 — Deploy to Vercel
- [ ] Push to main, confirm Vercel deployment succeeds

---

## Verification Steps for User

After deploy:
1. Log in to a test customer account
2. Go to Account → Security → Enable 2FA → choose Email → enter test code → confirm enabled
3. Log out → log in again → see OTP step → check email → enter code → confirm login success
4. Try wrong code 5 times → confirm lockout
5. Try expired code (wait 10+ min) → confirm "code expired" message
6. Disable 2FA → log out → log in → confirm no OTP step

---

## Rollback Plan
All schema changes are **additive** (new nullable columns with defaults).
To rollback: set `otpEnabled: false` for all customers (already the default).
No data loss on rollback.

---

## Progress Tracking

| Phase | Step | Status |
|-------|------|--------|
| 1 | Schema changes | ⬜ |
| 2 | otp.ts library | ⬜ |
| 2 | sendOtpEmail | ⬜ |
| 3 | auth.ts OTP flow | ⬜ |
| 4 | /otp/resend route | ⬜ |
| 4 | /otp/enable route | ⬜ |
| 4 | /otp/disable route | ⬜ |
| 4 | /otp/send-setup route | ⬜ |
| 5 | Login OTP step UI | ⬜ |
| 6 | Account settings OTP UI | ⬜ |
| 7 | Twilio dependency | ⬜ |
| 8 | Build + deploy | ⬜ |
