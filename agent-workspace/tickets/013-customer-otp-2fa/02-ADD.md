# ADD — Ticket 013: Customer OTP 2FA (SMS / Email)

## Architecture Overview

The solution mirrors the existing admin TOTP pattern (Ticket 008) with two key differences:
1. Codes are **time-limited one-time** (not TOTP rolling windows)
2. Delivery is async: **email via Resend** or **SMS via Twilio Verify**

No new dependencies beyond Twilio Verify SDK (for SMS).

---

## Data Layer — Prisma Schema Changes

### Customer model additions
```prisma
otpEnabled    Boolean   @default(false)
otpMethod     String?   // 'email' | 'sms'
otpCodeHash   String?   // SHA-256(code) — never plain text
otpCodeExpires DateTime?
otpAttempts   Int       @default(0)
```

`phone` field already exists on Customer model (E.164 format, optional).

---

## Authentication Flow

### Phase 1 — Credential validation (existing NextAuth authorize)

```
signIn('credentials-customer', { email, password, otpCode? })
│
├── Validate email + password (unchanged)
├── Check emailVerified (unchanged)
│
├── If otpEnabled:
│   ├── If no otpCode provided:
│   │   ├── Generate 6-digit code
│   │   ├── Hash (SHA-256) → store in DB + set expiry
│   │   ├── Send via otpMethod (email or SMS)
│   │   └── throw Error('OTP_REQUIRED')  ← client shows OTP input
│   │
│   └── If otpCode provided:
│       ├── Check attempts < 5 (else throw OTP_TOO_MANY_ATTEMPTS)
│       ├── Check code not expired (else throw OTP_EXPIRED)
│       ├── Compare SHA-256(otpCode) vs stored hash
│       ├── On success: clear code hash, reset attempts → return user
│       └── On failure: increment attempts, throw OTP_INVALID
│
└── If !otpEnabled: return user (unchanged)
```

### Why this pattern works with NextAuth
NextAuth's `authorize` runs on every `signIn()` call.
- First call: `{ email, password }` → validates credentials, sends OTP, throws
- Second call: `{ email, password, otpCode }` → validates credentials + OTP, returns user
This is identical to how admin TOTP works in auth.ts (Ticket 008), just with async delivery.

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/account/otp/resend` | POST | Resend OTP to user (rate-limited) |
| `/api/account/otp/enable` | POST | Enable OTP — verify test code + save preference |
| `/api/account/otp/disable` | POST | Disable OTP — verify current code |

---

## Email / SMS Delivery

### Email OTP (Resend — existing)
New function `sendOtpEmail(to, code, method)` in `src/lib/email.ts`.
Same template style as existing emails. Subject: "Your Sim2Me login code".

### SMS OTP (Twilio Verify)
- Uses `twilio` npm package (already vetted, industry standard)
- **Twilio Verify Service** handles:
  - Code generation server-side (no storage needed for SMS path)
  - Delivery with retry/fallback
  - Attempt limiting
  - Expiry (10 min default, configurable)
- Environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
- For SMS: instead of storing hash ourselves, we call `Twilio Verify → check`
- For Email: we generate+hash+store ourselves (no Twilio needed)

> **Note**: If Twilio env vars are not set, SMS option is hidden in UI and SMS users fall
> back to email. This prevents silent failures.

---

## UI Components

### Account Settings — Security Tab
Location: `src/app/[locale]/account/AccountClient.tsx` (existing Security tab structure)

New UI section within the existing Settings tab or new Security tab:
- Show current 2FA status (enabled/disabled, method)
- Enable flow: method selector + test code input
- Disable flow: password + code input

### Login Page OTP Step
Location: `src/app/[locale]/account/login/AccountLoginClient.tsx`

New state: `step: 'credentials' | 'otp'`
- Step 1: existing email+password form (unchanged visually)
- Step 2: OTP code input (6-digit), resend button, "back" option

---

## Security Controls

| Control | Implementation |
|---------|---------------|
| Rate limit sends | `checkRateLimit(ip, 'otp-send', 3, 600)` |
| Rate limit attempts | `checkRateLimit(ip, 'otp-attempt', 5, 600)` |
| Code expiry | `otpCodeExpires: new Date(Date.now() + 10*60*1000)` |
| Attempt tracking | `otpAttempts` field, max 5, reset on success |
| Code hashing | `crypto.createHash('sha256').update(code).digest('hex')` |
| Single use | Clear `otpCodeHash` + `otpAttempts` after success |
| No enumeration | Same error message regardless of user existence |

---

## Environment Variables Required

```
# SMS OTP (optional — SMS disabled if missing)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

No changes to existing env vars.

---

## Files Modified / Created

| File | Change Type |
|------|------------|
| `prisma/schema.prisma` | Add OTP fields to Customer |
| `src/lib/auth.ts` | Handle OTP flow in customer authorize |
| `src/lib/email.ts` | Add `sendOtpEmail` |
| `src/lib/otp.ts` | NEW — OTP generation, hashing, Twilio verify |
| `src/app/api/account/otp/resend/route.ts` | NEW |
| `src/app/api/account/otp/enable/route.ts` | NEW |
| `src/app/api/account/otp/disable/route.ts` | NEW |
| `src/app/[locale]/account/login/AccountLoginClient.tsx` | Add OTP step |
| `src/app/[locale]/account/AccountClient.tsx` | Add OTP settings UI |

**No changes to**: checkout, admin, webhooks, payment flows.
