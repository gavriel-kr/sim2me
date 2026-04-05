# ADD — Security Phase 4: Architectural Design

## Alignment with Existing Architecture
- Email: uses existing `Resend` + `src/lib/email.ts` pattern
- Auth: extends existing NextAuth `credentials` provider in `src/lib/auth.ts`
- Session: extends existing `getSessionForRequest` in `src/lib/session.ts`
- Rate limiting: uses existing `checkRateLimit` from `src/lib/rateLimit.ts`
- Admin pages: follows existing `page.tsx` + `Client.tsx` component split pattern
- No new routing patterns introduced

---

## F1 — Email Verification

### Schema additions to Customer
```prisma
emailVerified      Boolean   @default(false)
emailVerifyToken   String?
emailVerifyExpires DateTime?
```

### Migration strategy
- `emailVerified @default(false)` → new customers start unverified
- A one-time migration sets `emailVerified = true` for all existing customers (via Prisma `updateMany`)
- The migration runs automatically during `db push` as a post-step in `package.json` build

### Flow
```
POST /api/account/register
  → create Customer (emailVerified: false)
  → generate crypto.randomBytes(32).hex() token
  → store resetToken + expires (24h) in Customer
  → sendVerificationEmail(email, token)
  → return 201

GET /api/account/verify-email?token=xxx
  → find Customer where emailVerifyToken = token AND emailVerifyExpires > now()
  → set emailVerified = true, clear token fields
  → redirect to /[locale]/account/login?verified=true

POST /api/account/resend-verification (rate limited: 2/hour)
  → requires email in body
  → find Customer, check emailVerified = false
  → regenerate token, send email again
```

### NextAuth authorize change
```typescript
// In credentials-customer authorize():
if (!customer.emailVerified) {
  throw new Error('EMAIL_NOT_VERIFIED');
}
```
Error propagates to `signIn()` result as `result.error === 'EMAIL_NOT_VERIFIED'`.
Frontend login page shows: "Please verify your email. [Resend link]"

### Email
- Uses existing Resend + `src/lib/email.ts`
- 3-language template consistent with existing post-purchase emails

---

## F2 — Session Invalidation on Password Change

### Schema addition to Customer
```prisma
passwordChangedAt DateTime?
```

### Implementation
1. `POST /api/account/change-password` → on success, set `passwordChangedAt = new Date()`
2. `POST /api/account/reset-password` → same
3. In `src/lib/session.ts`, in `getSessionForRequest()`, after getting JWT session:
   ```typescript
   if (isCustomerSession(session)) {
     const customer = await prisma.customer.findUnique({
       where: { id: session.user.id },
       select: { passwordChangedAt: true }
     });
     const tokenIat = (session as {iat?: number}).iat ?? 0;
     if (customer?.passwordChangedAt && customer.passwordChangedAt.getTime() / 1000 > tokenIat) {
       return null; // session pre-dates password change → invalid
     }
   }
   ```
4. API routes that call `getSessionForRequest()` automatically respect this — no other changes needed.

**Performance note**: One extra DB query per authenticated API call. Acceptable for a low-traffic admin/account app.

---

## F3 — Admin Audit Log

### New model
```prisma
model AdminAuditLog {
  id         String   @id @default(cuid())
  adminEmail String
  adminName  String
  action     String   // "DELETE_ARTICLE", "UPDATE_SETTINGS", "CHANGE_PRICE" etc.
  targetType String?  // "Article", "Order", "PackageOverride", "AdminUser"
  targetId   String?
  details    String?  @db.Text  // JSON summary: { before, after } or { count }
  ip         String?
  createdAt  DateTime @default(now())
  @@map("admin_audit_logs")
}
```

### Helper: `src/lib/audit.ts`
```typescript
export async function createAuditLog(params: {
  adminEmail: string;
  adminName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: object;
  ip?: string;
}) {
  await prisma.adminAuditLog.create({
    data: { ...params, details: params.details ? JSON.stringify(params.details) : null }
  }).catch(() => {}); // fire-and-forget, never block the action
}
```

### Actions logged
| Route | Action |
|-------|--------|
| DELETE `/api/admin/articles/[id]` | `DELETE_ARTICLE` |
| PATCH `/api/admin/articles/[id]` | `UPDATE_ARTICLE` |
| POST `/api/admin/articles` | `CREATE_ARTICLE` |
| POST `/api/admin/settings` | `UPDATE_SETTINGS` |
| POST `/api/admin/packages/override` | `UPDATE_PACKAGE_OVERRIDE` |
| POST `/api/admin/packages/apply-price-floor` | `APPLY_PRICE_FLOOR` |
| PATCH `/api/admin/orders/[id]` (bulk update) | `UPDATE_ORDER` |
| POST `/api/admin/users` | `CREATE_ADMIN_USER` |
| PATCH `/api/admin/users` | `UPDATE_ADMIN_USER` |
| DELETE `/api/admin/users` | `DELETE_ADMIN_USER` |

### Admin UI: `/admin/audit-log`
- Server component fetches last 50 logs (paginated)
- Table columns: Time, Admin, Action, Target, Details (expandable)
- Filter by admin email (client-side)
- Sidebar link added to AdminSidebar

---

## F4 — 2FA TOTP

### New dependencies
- `otplib` — TOTP algorithm implementation
- `qrcode` — generates base64 QR code image from `otpauth://totp/...` URI

### Schema additions to AdminUser
```prisma
totpSecret     String?
totpEnabled    Boolean  @default(false)
totpVerifiedAt DateTime?
```

### Setup flow (new admin page: `/admin/security`)
```
GET /api/admin/totp/setup
  → generate new secret (otplib.authenticator.generateSecret())
  → store as temporary session value (NOT in DB yet)
  → return { secret, qrCodeDataUrl, otpauthUri }

POST /api/admin/totp/setup  { code: "123456" }
  → verify code against temp secret
  → if valid: save secret + totpEnabled=true to AdminUser
  → return { success: true }

POST /api/admin/totp/disable  { code: "123456" }
  → verify current TOTP code
  → if valid: clear secret, totpEnabled=false
```

### Login flow modification

**In `src/lib/auth.ts` credentials authorize (admin provider)**:
```typescript
async authorize(credentials) {
  // 1. Rate limit (already done)
  // 2. Validate password (already done)
  // 3. Check TOTP
  if (user.totpEnabled) {
    const code = credentials.totpCode as string | undefined;
    if (!code) {
      throw new Error('TOTP_REQUIRED');
    }
    const valid = authenticator.verify({ token: code, secret: user.totpSecret! });
    if (!valid) {
      throw new Error('TOTP_INVALID');
    }
  }
  // 4. Return user
}
```

**In `src/app/admin/login/page.tsx`**:
- Step 1: email + password form (existing)
- If error === 'TOTP_REQUIRED': show TOTP step (6-digit code input)
- Step 2: re-submit email + password + totpCode
- If error === 'TOTP_INVALID': show "Invalid code" on TOTP screen

---

## F5 — TypeScript Cleanup

### Strategy
1. Exclude `prisma/` from tsconfig:
   ```json
   // tsconfig.json — add to "exclude":
   "prisma/scripts/**/*",
   "prisma/seed*.ts",
   "prisma/update-*.ts",
   "prisma/migrate-*.ts"
   ```
2. Fix remaining ~15 `src/` TypeScript errors (admin pages):
   - Add missing type annotations to callback parameters
   - Fix `OrderForFilter` type to include all fields used in AdminOrdersClient
   - Fix `ContactForFilter` / `Submission` type mismatch
3. Remove flags from `next.config.mjs`:
   - `typescript: { ignoreBuildErrors: true }`
   - `eslint: { ignoreDuringBuilds: true }`
4. Run `npx next build` — must pass with 0 errors

---

## Risk Assessment
| Change | Risk | Mitigation |
|--------|------|------------|
| Email verification blocks login | **HIGH** — blocks all new signups if email fails | Existing users grandfathered; test email flow before deploy |
| Session invalidation | Low | DB check is read-only, fails gracefully |
| Audit log | Very Low | fire-and-forget, never blocks actions |
| 2FA | Medium | Only applies to admins who enable it |
| TS cleanup | Low-Medium | Fix errors in test order, build must pass |
