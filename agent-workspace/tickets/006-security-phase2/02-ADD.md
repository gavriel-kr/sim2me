# ADD — Security Phase 2: Architectural Design

## Alignment with Project Architecture
All changes follow patterns already established in Phase 1 (ticket 005):
- `requireAdmin()` helper in `src/lib/session.ts` — import and apply.
- No new files except a tiny `escapeHtml` utility added to an existing lib file.
- No new dependencies, no schema changes, no new API routes.

---

## Change Map

### C1 — Admin Route Hardening

**Pattern (already in use):**
```typescript
// Before (weak):
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// After (hardened):
const session = await getServerSession(authOptions);
const denied = requireAdmin(session);
if (denied) return denied;
```

**Files affected:** 17 route files under `src/app/api/admin/`  
**Mechanism:** `requireAdmin` (already in `src/lib/session.ts`) returns a 401 if no session,
403 if session exists but `user.type !== 'admin'`.  
**Risk:** Zero — purely restrictive change. Admin users are unaffected. Non-admin users are
blocked.

---

### H1 — Strip credentials from `by-transaction` response

**File:** `src/app/api/orders/by-transaction/[transactionId]/route.ts`

The Prisma `select` block and the returned JSON object both include `qrCodeUrl`, `smdpAddress`,
`activationCode`. Remove these three fields entirely.

The success page polls this endpoint only to know the order `status` (pending/completed/failed).
QR/credentials are shown via the authenticated account dashboard, not the polling endpoint.

**Risk:** Low — success page currently uses status only for the spinner. The actual QR display
(if any) comes from the orders page which is authenticated. Verify in CheckoutSuccess component
before applying.

---

### H2 — Block guest account takeover in register

**File:** `src/app/api/account/register/route.ts`

Current logic:
```
if (existingByEmail?.password) → 409
// else if existingByEmail (no password) → silently merge
```

New logic:
```
if (existingByEmail) → 409 always
// (no merge path)
```

The 409 message should say:
> "An account with this email already exists. Sign in or use forgot password."

**Risk:** Low. The merge path was a convenience for the rare guest → registered flow.
Removing it is safer; user can use forgot-password to set a password on their existing account.

---

### H3 — Remove wholesalePrice from packages API

**File:** `src/app/api/packages/route.ts`

Remove the `wholesalePrice` field from the mapped object returned in the response.
This field is not used by any frontend component (it was in the API response only).

**Risk:** Minimal — run `rg wholesalePrice` to confirm no frontend component reads it.

---

### M1 — HTML injection in contact email

**File:** `src/app/api/contact/route.ts`

Add a one-line helper at the top of the file:
```typescript
const escapeHtml = (s: string) =>
  s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
```

Apply to all user-supplied fields interpolated in the HTML string:
`name`, `email`, `subject`, `message`.

**Risk:** Zero — emails will render identically for normal input; only malicious HTML chars are
escaped.

---

### M2 — Rate limiter observability

**File:** `src/lib/rateLimit.ts`

In the `catch` block, add one line:
```typescript
console.error('[RateLimit] DB error:', e);
```

**Risk:** Zero — behavior unchanged, only adds a log statement.

---

## Verification Checklist (post-implementation)
- [ ] `rg "if (!session)" src/app/api/admin/` returns 0 results (all replaced with requireAdmin).
- [ ] `rg "wholesalePrice" src/` returns results only in route.ts map function (removed) — not in response.
- [ ] `GET /api/orders/by-transaction/txn_xxx` response JSON has no `qrCodeUrl`, `smdpAddress`, `activationCode`.
- [ ] Register with existing guest email → 409.
- [ ] Contact form with `<script>alert(1)</script>` as name → email shows `&lt;script&gt;`.
