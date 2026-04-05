# DIP — Security Phase 4: Detailed Implementation Plan

---

## Phase 1 — Schema Migration

### Step 1.1 — Add fields to Customer
- [ ] `prisma/schema.prisma`: add to Customer model:
  ```prisma
  emailVerified      Boolean   @default(false)
  emailVerifyToken   String?
  emailVerifyExpires DateTime?
  passwordChangedAt  DateTime?
  ```

### Step 1.2 — Add fields to AdminUser
- [ ] `prisma/schema.prisma`: add to AdminUser model:
  ```prisma
  totpSecret     String?
  totpEnabled    Boolean  @default(false)
  totpVerifiedAt DateTime?
  ```

### Step 1.3 — Add AdminAuditLog model
- [ ] `prisma/schema.prisma`: add full `AdminAuditLog` model

### Step 1.4 — Push schema + migrate existing customers
- [ ] `npx prisma db push` (with DIRECT_URL set)
- [ ] Run one-time migration: set `emailVerified = true` for all existing customers
  ```typescript
  // via prisma studio or direct query:
  prisma.customer.updateMany({ data: { emailVerified: true } })
  ```
- [ ] Verify: `prisma.customer.count({ where: { emailVerified: false } })` === 0

---

## Phase 2 — Email Verification

### Step 2.1 — Add sendVerificationEmail to src/lib/email.ts
- [ ] New function: `sendVerificationEmail(email: string, token: string, locale?: string)`
- [ ] Hebrew, English, Arabic templates (based on existing post-purchase email pattern)
- [ ] Link format: `https://www.sim2me.net/api/account/verify-email?token=${token}`

### Step 2.2 — Modify POST /api/account/register
- [ ] Generate `crypto.randomBytes(32).hex()` token
- [ ] Store `emailVerifyToken`, `emailVerifyExpires` (now + 24h), `emailVerified: false` in Customer
- [ ] Call `sendVerificationEmail()` after creating account
- [ ] Return 201 with message "Check your email to verify your account"

### Step 2.3 — New route: GET /api/account/verify-email
- [ ] Find Customer by `emailVerifyToken` where `emailVerifyExpires > now()`
- [ ] Set `emailVerified: true`, clear token fields
- [ ] Redirect to `/he/account/login?verified=true` (default locale he)

### Step 2.4 — New route: POST /api/account/resend-verification
- [ ] Rate limit: 2 per hour per IP
- [ ] Accept `{ email }` in body
- [ ] Find Customer where `emailVerified = false`
- [ ] Regenerate token, send email again
- [ ] Always return 200 (don't reveal if email exists)

### Step 2.5 — Modify NextAuth customer authorize
- [ ] In `src/lib/auth.ts` credentials-customer provider:
  ```typescript
  if (!customer.emailVerified) {
    throw new Error('EMAIL_NOT_VERIFIED');
  }
  ```

### Step 2.6 — Update login page to handle EMAIL_NOT_VERIFIED error
- [ ] In `src/app/[locale]/account/login/` (find the login client component)
- [ ] If error === 'EMAIL_NOT_VERIFIED': show message + "Resend verification email" button
- [ ] Button calls `POST /api/account/resend-verification`

### Step 2.7 — Test end-to-end
- [ ] Register new account → cannot log in → verify email → can log in
- [ ] Existing accounts log in normally (emailVerified = true)

---

## Phase 3 — Session Invalidation on Password Change

### Step 3.1 — Update change-password route
- [ ] `src/app/api/account/change-password/route.ts`:
  add `passwordChangedAt: new Date()` to the `prisma.customer.update()`

### Step 3.2 — Update reset-password route
- [ ] `src/app/api/account/reset-password/route.ts`:
  add `passwordChangedAt: new Date()` to the `prisma.customer.update()`

### Step 3.3 — Update getSessionForRequest in src/lib/session.ts
- [ ] After getting session, if `isCustomerSession(session)`:
  - Fetch `passwordChangedAt` from DB for `session.user.id`
  - Get `iat` from JWT (available via `getToken()` from `next-auth/jwt`)
  - If `passwordChangedAt > new Date(iat * 1000)` → return null

### Step 3.4 — Verify
- [ ] Log in as customer → change password → old session now returns 401 on next API call

---

## Phase 4 — Admin Audit Log

### Step 4.1 — Create src/lib/audit.ts
- [ ] `createAuditLog()` helper function (fire-and-forget, never throws)

### Step 4.2 — Add audit calls to 10 admin routes
- [ ] DELETE `api/admin/articles/[id]` → `DELETE_ARTICLE`
- [ ] PATCH `api/admin/articles/[id]` → `UPDATE_ARTICLE`
- [ ] POST `api/admin/articles` → `CREATE_ARTICLE`
- [ ] POST `api/admin/settings` → `UPDATE_SETTINGS`
- [ ] POST/PATCH `api/admin/packages/override` → `UPDATE_PACKAGE_OVERRIDE`
- [ ] POST `api/admin/packages/apply-price-floor` → `APPLY_PRICE_FLOOR`
- [ ] POST `api/admin/orders/bulk-update` → `UPDATE_ORDER_BULK`
- [ ] POST `api/admin/users` → `CREATE_ADMIN_USER`
- [ ] PATCH `api/admin/users` → `UPDATE_ADMIN_USER`
- [ ] DELETE `api/admin/users` → `DELETE_ADMIN_USER`

### Step 4.3 — Create /admin/audit-log page
- [ ] `src/app/admin/audit-log/page.tsx` — server component, fetches logs (50/page)
- [ ] `src/app/admin/audit-log/AuditLogClient.tsx` — table UI, filter by admin
- [ ] Add "Audit Log" link to `src/components/admin/AdminSidebar.tsx`

---

## Phase 5 — 2FA TOTP for Admins

### Step 5.1 — Install dependencies
- [ ] `npm install otplib qrcode`
- [ ] `npm install --save-dev @types/qrcode`

### Step 5.2 — TOTP setup API routes
- [ ] `POST /api/admin/totp/generate` → generate secret, return QR code (requireAdmin)
- [ ] `POST /api/admin/totp/enable` → verify code, save secret + totpEnabled=true (requireAdmin)
- [ ] `POST /api/admin/totp/disable` → verify code, clear secret + totpEnabled=false (requireAdmin)

### Step 5.3 — Create /admin/security page
- [ ] `src/app/admin/security/page.tsx` — server component, shows current TOTP status
- [ ] `src/app/admin/security/SecurityClient.tsx` — UI for enable/disable TOTP with QR setup wizard
- [ ] Add "Security" link to AdminSidebar

### Step 5.4 — Modify admin login flow (auth.ts + login page)
- [ ] In `src/lib/auth.ts` admin `authorize()`:
  - After password validation: check `user.totpEnabled`
  - If enabled + no `credentials.totpCode`: throw `Error('TOTP_REQUIRED')`
  - If enabled + totpCode present: verify with `otplib.authenticator.verify()`
  - If invalid: throw `Error('TOTP_INVALID')`
- [ ] In `src/app/admin/login/page.tsx`:
  - Add state `step: 'password' | 'totp'`
  - On TOTP_REQUIRED error: show step 2 (TOTP input)
  - On submit step 2: send email + password + totpCode

### Step 5.5 — Test
- [ ] Enable 2FA → scan QR → confirm code → 2FA active
- [ ] Log out → log in → TOTP step appears → enter code → access granted
- [ ] Wrong code → error → can retry (within rate limit)

---

## Phase 6 — TypeScript Cleanup

### Step 6.1 — Exclude seed scripts from tsconfig
- [ ] `tsconfig.json`: add `prisma/` to `exclude` array
- [ ] `npx tsc --noEmit` → only src/ errors remain

### Step 6.2 — Fix src/ TypeScript errors
- [ ] `AdminOrdersClient.tsx`: update `OrderForFilter` type to include all used fields
- [ ] `ContactSubmissionsClient.tsx`: fix `Submission` vs `ContactForFilter` type mismatch
- [ ] `ArticlesClient.tsx`: fix regex flags (use string literal method or target update)
- [ ] Minor `any` types in admin pages (add proper type annotations)
- [ ] `SuccessClient.tsx`: fix "loading" status comparison

### Step 6.3 — Remove flags from next.config.mjs
- [ ] Remove `typescript: { ignoreBuildErrors: true }`
- [ ] Remove `eslint: { ignoreDuringBuilds: true }`
- [ ] `npx next build` → must pass with 0 errors

---

## Phase 7 — Final Verification & Commit

- [ ] `npm run build` passes (next build step only)
- [ ] Email verification: register → verify → login
- [ ] Session invalidation: change password → old session rejected
- [ ] Audit log: perform admin action → appears in `/admin/audit-log`
- [ ] 2FA: enable → log in with TOTP → success
- [ ] Linter: 0 errors on all modified files
- [ ] Commit and push

---

## Files Created/Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | +4 Customer fields, +3 AdminUser fields, +AdminAuditLog model |
| `src/lib/email.ts` | +sendVerificationEmail() |
| `src/lib/auth.ts` | email verified check + TOTP check in authorize |
| `src/lib/session.ts` | passwordChangedAt check in getSessionForRequest |
| `src/lib/audit.ts` | New file: createAuditLog() helper |
| `src/lib/validation/schemas.ts` | +verifyEmailSchema, +resendVerificationSchema |
| `src/app/api/account/register/route.ts` | Send verification email |
| `src/app/api/account/verify-email/route.ts` | New route |
| `src/app/api/account/resend-verification/route.ts` | New route |
| `src/app/api/account/change-password/route.ts` | +passwordChangedAt |
| `src/app/api/account/reset-password/route.ts` | +passwordChangedAt |
| `src/app/api/admin/totp/generate/route.ts` | New route |
| `src/app/api/admin/totp/enable/route.ts` | New route |
| `src/app/api/admin/totp/disable/route.ts` | New route |
| `src/app/admin/security/page.tsx` | New page |
| `src/app/admin/security/SecurityClient.tsx` | New component |
| `src/app/admin/audit-log/page.tsx` | New page |
| `src/app/admin/audit-log/AuditLogClient.tsx` | New component |
| `src/app/admin/login/page.tsx` | +TOTP step |
| `src/components/admin/AdminSidebar.tsx` | +Security, +Audit Log links |
| `10 admin route.ts files` | +createAuditLog() calls |
| `tsconfig.json` | exclude prisma/ scripts |
| `next.config.mjs` | remove ignoreBuildErrors |
| `src/app/[locale]/account/login/` | EMAIL_NOT_VERIFIED handling |
| `package.json` | +otplib, +qrcode |
