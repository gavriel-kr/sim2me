# PRD — Security Phase 5: Hardening Round 2

## Context
Tickets 005–008 closed all critical and most high-severity security gaps.
This ticket closes the remaining high/medium items that don't require major dependency upgrades.

## Scope

### 1. 2FA Enforcement for Admins (Required for SUPER_ADMIN / ADMIN roles)
- Currently 2FA is optional for all admin users.
- ADMIN and SUPER_ADMIN accounts control pricing, orders, and user management — a compromised account is catastrophic.
- **Decision needed**: Force 2FA for ADMIN/SUPER_ADMIN on next login (block login if not set up).
- EDITOR role: warn but don't block.

### 2. Admin 2FA Status Visibility in Users List
- Show which admin accounts have 2FA enabled in the admin/users page.
- SUPER_ADMIN can see at a glance who is unprotected.

### 3. Cookie Session Invalidation on Password Change (Complete)
- Currently `passwordChangedAt` is stored on password change.
- Bearer tokens (mobile) are correctly invalidated.
- Cookie sessions (web) — `getToken()` requires a `NextRequest`, not available in all call sites.
- **Fix**: Properly use `getToken` with the native request object in all API routes that call `getSessionForRequest`.

### 4. Dependabot Automatic Dependency Updates
- Add `.github/dependabot.yml` to get automatic PRs for npm CVEs.
- Targets: npm ecosystem, weekly schedule, grouped by type.

### 5. Admin Password Age Warning
- Track when each admin last changed their password.
- Show a warning in the admin panel if password is older than 90 days.
- Non-blocking (warning only, not forced logout).

### 6. Audit Log for Admin Login Events
- Currently audit log records admin ACTIONS but not LOGIN events.
- Add login success/failure entries to AdminAuditLog for security visibility.

## Out of Scope (separate tickets)
- Customer 2FA → Ticket 010
- Next.js 15 upgrade → Ticket 010
- TypeScript cleanup → Ticket 011
