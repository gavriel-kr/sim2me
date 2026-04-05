# DIP — Security Phase 5: Detailed Implementation Plan

---

## Phase 1 — Schema + DB
### Step 1.1
- [ ] `prisma/schema.prisma`: add `passwordChangedAt DateTime?` to `AdminUser` model
- [ ] Run `npx prisma db push`
- [ ] Verify schema sync ✓

---

## Phase 2 — 2FA Warning for ADMIN/SUPER_ADMIN (non-blocking)
### Step 2.1 — auth.ts
- [ ] After successful login, if `user.role` is `ADMIN` or `SUPER_ADMIN` AND `!user.totpEnabled`:
  - Return user normally (login succeeds) but set a flag `totpWarning: true` in JWT token
- [ ] Add login audit log entries (fire-and-forget):
  - Success: `createAuditLog({ action: 'ADMIN_LOGIN', ... })`
  - 2FA code failure: `createAuditLog({ action: 'ADMIN_LOGIN_2FA_FAIL', ... })`

### Step 2.2 — Admin layout banner
- [ ] After login, if session has `totpWarning: true`, show dismissible amber banner in admin layout:
  "⚠️ Your account has no 2FA protection. [Set up 2FA →] or [Dismiss]"
- [ ] Banner links directly to `/admin/security`

---

## Phase 3 — 2FA Status in Admin Users List
### Step 3.1 — admin/users/page.tsx
- [ ] Add `totpEnabled: true` to the `select` clause of `prisma.adminUser.findMany()`
- [ ] Pass `totpEnabled` to `UsersClient`

### Step 3.2 — admin/users/UsersClient.tsx
- [ ] Add a "2FA" column to the users table
- [ ] Show: ✅ Enabled / ⚠️ Disabled badge per row

---

## Phase 4 — Cookie Session Invalidation (Complete Fix)
### Step 4.1 — src/lib/session.ts
- [ ] In the cookie session branch: check if `request` has `cookies` property (NextRequest)
- [ ] If yes: call `getToken({ req: request as NextRequest })` to get raw JWT with `iat`
- [ ] Compare `iat` against `customer.passwordChangedAt` (same logic as Bearer branch)
- [ ] Clean up the existing verbose comment block

---

## Phase 5 — Admin Password Age Warning
### Step 5.1 — Admin Layout or Dashboard
- [ ] In `src/app/admin/layout.tsx` (server component): fetch current admin's `passwordChangedAt`
- [ ] If null OR older than 90 days: pass `showPasswordWarning: true` to layout
- [ ] Show dismissible yellow banner: "Your password hasn't been changed in 90+ days. Consider updating it."

---

## Phase 6 — Dependabot
### Step 6.1
- [ ] Create `.github/dependabot.yml` with npm ecosystem, weekly schedule, grouped updates
- [ ] Verify file structure is correct

---

## Phase 7 — Verification + Deploy
- [ ] Run `npm run build` — must pass
- [ ] Verify admin login still works (no 2FA required for EDITOR)
- [ ] Verify ADMIN/SUPER_ADMIN without 2FA are redirected to setup
- [ ] Verify ADMIN/SUPER_ADMIN with 2FA can log in normally
- [ ] Verify admin users list shows 2FA status
- [ ] Verify Dependabot file is valid
- [ ] `git push` → Vercel deploy
- [ ] Smoke test production

---

## Progress Tracker
- [ ] Phase 1 — Schema
- [ ] Phase 2 — 2FA enforcement + login audit
- [ ] Phase 3 — 2FA visibility in users list
- [ ] Phase 4 — Cookie session invalidation
- [ ] Phase 5 — Password age warning
- [ ] Phase 6 — Dependabot
- [ ] Phase 7 — Verification + deploy
