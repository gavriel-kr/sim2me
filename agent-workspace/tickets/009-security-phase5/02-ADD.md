# ADD — Security Phase 5: Architectural Design Document

## Architecture Principles (from project-standards)
- Minimal footprint — prefer modifying existing files over new files
- Additive DB changes only (no drops or renames)
- Fire-and-forget for audit/email side effects
- All auth changes must preserve existing working functionality

## Design Decisions

### 1. 2FA Enforcement

**Approach**: Modify `auth.ts` admin `authorize()` callback.
- If `user.role === 'SUPER_ADMIN' || 'ADMIN'` AND `!user.totpEnabled` → throw `'TOTP_SETUP_REQUIRED'`
- Admin login page detects this error and redirects to `/admin/security` with a message
- EDITOR role: allow login without 2FA (lower risk)

**No schema change needed** — `totpEnabled` already exists on `AdminUser`.

### 2. 2FA Status in Users List

**Approach**: Modify existing `admin/users/page.tsx` to select `totpEnabled` field and pass to `UsersClient`.
- Show green checkmark / red X badge in the users table.
- No new routes or files needed.

### 3. Cookie Session Invalidation

**Current state**: `getSessionForRequest()` does a `getToken()` attempt for cookie sessions when `request` is provided.
**Problem**: The `getToken()` call requires a proper `NextRequest` object, but standard `Request` may not work.

**Fix**: Use `next-auth/jwt`'s `getToken` with explicit `cookieName` and cast to `NextRequest`.
- Only applied when `request` is a proper `NextRequest` (has `cookies` property).
- Graceful fallback — if token unavailable, allow session (fail-open, not fail-closed for session checks).

### 4. Dependabot

**File**: `.github/dependabot.yml`
- Package ecosystem: `npm`
- Schedule: weekly (Monday)
- Groups: `production` deps and `dev` deps separately
- Labels: `dependencies`, `security`

### 5. Admin Password Age Warning

**Approach**: Add `passwordChangedAt` to `AdminUser` schema (new nullable field).
- Update password on admin panel when admin changes their own password (future feature).
- For now: read `updatedAt` as proxy for password age OR add `passwordChangedAt` field.
- Show banner in admin layout if `passwordChangedAt` is null OR > 90 days ago.

**Schema change**: Add `passwordChangedAt DateTime?` to `AdminUser`.

### 6. Audit Log for Login Events

**Approach**: In `auth.ts` admin `authorize()`, after successful login, call `createAuditLog()`.
- `action: 'ADMIN_LOGIN'`, `adminEmail`, `adminName`, `ip`.
- Also log `ADMIN_LOGIN_FAILED` on failed attempts (wrong password, 2FA failure).
- All fire-and-forget — never blocks login flow.

## Files Modified
| File | Change |
|------|--------|
| `src/lib/auth.ts` | 2FA enforcement + login audit log |
| `src/lib/session.ts` | Improved cookie session invalidation |
| `src/app/admin/users/page.tsx` | Add totpEnabled to query |
| `src/app/admin/users/UsersClient.tsx` | Add 2FA status badge |
| `src/app/admin/login/page.tsx` | Handle TOTP_SETUP_REQUIRED error |
| `prisma/schema.prisma` | Add passwordChangedAt to AdminUser |
| `.github/dependabot.yml` | New file |

## Files NOT Modified
- All customer-facing routes
- Paddle webhook
- All existing security mechanisms
