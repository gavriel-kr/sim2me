# PRD — Security Phase 4: Authentication Hardening

## Context
Tickets 005–007 completed all high-impact, low-effort security fixes.
This ticket addresses the remaining architectural security items requiring schema changes and new flows.

## User Decisions
- **Email Verification**: Required — user cannot log in before verifying email
- **Admin Audit Log**: UI page in admin panel + DB records
- **2FA**: TOTP via Authenticator App (Google Authenticator / Authy)

---

## Features in Scope

### F1 — Email Verification on Registration
**Problem**: Users can register with any email and log in immediately — including fake or stolen emails.

**Behaviour**:
1. Customer registers → account created with `emailVerified = false`
2. Verification email is sent (link valid 24 hours) — in all 3 languages (he, en, ar)
3. Login attempt with unverified email → rejected with message "Please verify your email first"
4. User clicks link in email → `emailVerified = true`, redirected to account
5. Resend verification option available on the login error state
6. All **existing** customers are migrated to `emailVerified = true` (grandfathered)

---

### F2 — Session Invalidation on Password Change
**Problem**: After a password change, all previous JWT sessions remain valid for up to 7 days.
If a session is stolen, changing the password does not revoke access.

**Behaviour**:
- Customer record stores `passwordChangedAt` timestamp
- JWT includes `iat` (issued-at) timestamp (standard NextAuth JWT)
- On every authenticated API request, if `customer.passwordChangedAt > token.iat` → session rejected (401)
- This is checked only for customer sessions, not admin sessions

---

### F3 — Admin Audit Log
**Problem**: No record of admin actions — cannot investigate incidents.

**Behaviour**:
- Every significant admin action is logged: create/update/delete articles, update settings,
  change prices, change package visibility, update orders, manage users
- Log entry: who, what action, which record, IP, timestamp
- `/admin/audit-log` page: table with columns (Time, Admin, Action, Target, Details)
  - Sortable by time (default: newest first)
  - Paginated (50 per page)
  - Filterable by admin email

---

### F4 — 2FA for Admin Login (TOTP)
**Problem**: Admin login has a single factor — phished password gives full admin access.

**Behaviour**:
- Admin can enable 2FA from `/admin/security` settings page
- Setup: generate secret → show QR code → admin scans with Authenticator App → enters 6-digit code to confirm
- Login: after password validation, if `totpEnabled = true`, a second screen asks for 6-digit code
- Wrong TOTP code → login rejected (rate limited with existing admin-login rate limit)
- Admin can disable 2FA (requires current TOTP code to confirm)

---

### F5 — TypeScript Cleanup + Remove ignoreBuildErrors
**Problem**: `typescript: { ignoreBuildErrors: true }` silently deploys TypeScript errors.

**Approach**:
- Exclude `prisma/` scripts from `tsconfig.json` (they are seed files, not production code)
- Fix remaining ~15 TypeScript errors in `src/app/admin/` pages
- Remove `typescript: { ignoreBuildErrors: true }` and `eslint: { ignoreDuringBuilds: true }` from `next.config.mjs`
- Build must pass with 0 errors

---

## New Dependencies Required
- `otplib` — TOTP generation and verification (2FA)
- `qrcode` — Generate QR code data URL from TOTP URI (2FA setup screen)

Both are small, well-maintained, no native dependencies.

---

## Schema Changes (all additive — no breaking changes)

### Customer model additions:
```prisma
emailVerified      Boolean   @default(false)
emailVerifyToken   String?
emailVerifyExpires DateTime?
passwordChangedAt  DateTime?
```

### AdminUser model additions:
```prisma
totpSecret    String?
totpEnabled   Boolean @default(false)
totpVerifiedAt DateTime?
```

### New model:
```prisma
model AdminAuditLog {
  id         String   @id @default(cuid())
  adminEmail String
  adminName  String
  action     String
  targetType String?
  targetId   String?
  details    String?  @db.Text
  ip         String?
  createdAt  DateTime @default(now())
  @@map("admin_audit_logs")
}
```

---

## Success Criteria
- [ ] New customer cannot log in without clicking verification email
- [ ] Existing customers are unaffected (grandfathered as verified)
- [ ] Changing password from Account page invalidates all other sessions within one request cycle
- [ ] Admin action (e.g. delete article) creates an audit log entry visible in `/admin/audit-log`
- [ ] Admin with 2FA enabled must enter TOTP code after password login
- [ ] `npm run build` (next build step) passes with 0 TypeScript errors
