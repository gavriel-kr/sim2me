# DIP — Security Phase 2: Detailed Implementation Plan

## Phase 1 — CRITICAL: Admin Route Hardening (17 routes)

**Goal:** Replace `if (!session)` with `requireAdmin(session)` on every remaining admin route.

### Step 1.1 — Group 1: Settings & SEO (4 files)
- [ ] `src/app/api/admin/settings/route.ts`
- [ ] `src/app/api/admin/settings/upload/route.ts`
- [ ] `src/app/api/admin/seo/route.ts`
- [ ] `src/app/api/admin/seo/global/route.ts`

### Step 1.2 — Group 2: SEO dynamic + Articles (4 files)
- [ ] `src/app/api/admin/seo/[id]/route.ts`
- [ ] `src/app/api/admin/articles/[id]/route.ts`
- [ ] `src/app/api/admin/articles/bulk-fill-keywords/route.ts`
- [ ] `src/app/api/admin/articles/default-image/route.ts`

### Step 1.3 — Group 3: Contact management (4 files)
- [ ] `src/app/api/admin/contact/[id]/route.ts`
- [ ] `src/app/api/admin/contact/[id]/notes/route.ts`
- [ ] `src/app/api/admin/contact/[id]/read/route.ts`
- [ ] `src/app/api/admin/contact/bulk-update/route.ts`

### Step 1.4 — Group 4: Misc admin (5 files)
- [ ] `src/app/api/admin/packages/cache-status/route.ts`
- [ ] `src/app/api/admin/orders/backfill-costs/route.ts`
- [ ] `src/app/api/admin/pages/sync/route.ts`
- [ ] `src/app/api/admin/users/route.ts`
- [ ] `src/app/api/admin/update-phase7-articles/route.ts`

### Step 1.5 — Verify
- [ ] Run: `rg "if (!session)" src/app/api/admin/` → must return 0 matches
- [ ] Run linter on all modified files

---

## Phase 2 — HIGH: eSIM Credential Leak (1 file)

### Step 2.1 — Audit success page usage
- [ ] Read `src/app/[locale]/success/` to confirm which fields are consumed from `by-transaction`

### Step 2.2 — Strip credentials from response
- [ ] In `src/app/api/orders/by-transaction/[transactionId]/route.ts`:
  - Remove `qrCodeUrl`, `smdpAddress`, `activationCode` from Prisma `select`
  - Remove these three fields from the returned `order` JSON object

---

## Phase 3 — HIGH: Guest Account Takeover (1 file)

### Step 3.1 — Fix register logic
- [ ] In `src/app/api/account/register/route.ts`:
  - Change `if (existingByEmail?.password)` → `if (existingByEmail)` → always 409
  - Remove the `if (existingByEmail)` merge block below it

---

## Phase 4 — HIGH: Wholesale Price Leak (1 file)

### Step 4.1 — Confirm no frontend usage
- [ ] Run: `rg "wholesalePrice" src/` — confirm no frontend component reads it

### Step 4.2 — Remove from API response
- [ ] In `src/app/api/packages/route.ts`: delete the `wholesalePrice` line from the map object

---

## Phase 5 — MEDIUM: HTML Injection in Contact Email (1 file)

### Step 5.1 — Add escapeHtml and apply
- [ ] In `src/app/api/contact/route.ts`:
  - Add `escapeHtml` helper at top of file
  - Wrap `name`, `email`, `subject`, `message` in `escapeHtml()` inside the HTML template

---

## Phase 6 — MEDIUM: Rate Limiter Observability (1 file)

### Step 6.1 — Add error log
- [ ] In `src/lib/rateLimit.ts`: add `console.error('[RateLimit] DB error:', e)` in catch block

---

## Phase 7 — Final Verification & Commit

- [ ] Run linter across all modified files
- [ ] Manual test: log in as regular customer, call `GET /api/admin/users` → expect 403
- [ ] Manual test: register with existing guest email → expect 409
- [ ] Confirm `GET /api/packages` response has no `wholesalePrice`
- [ ] Confirm `GET /api/orders/by-transaction/txn_xxx` has no `qrCodeUrl` / `activationCode`
- [ ] Commit all changes
- [ ] Update CHANGELOG / MEMORY

---

## Files Modified (total: 24)
| File | Change |
|------|--------|
| `src/app/api/admin/settings/route.ts` | requireAdmin |
| `src/app/api/admin/settings/upload/route.ts` | requireAdmin |
| `src/app/api/admin/seo/route.ts` | requireAdmin |
| `src/app/api/admin/seo/global/route.ts` | requireAdmin |
| `src/app/api/admin/seo/[id]/route.ts` | requireAdmin |
| `src/app/api/admin/articles/[id]/route.ts` | requireAdmin |
| `src/app/api/admin/articles/bulk-fill-keywords/route.ts` | requireAdmin |
| `src/app/api/admin/articles/default-image/route.ts` | requireAdmin |
| `src/app/api/admin/contact/[id]/route.ts` | requireAdmin |
| `src/app/api/admin/contact/[id]/notes/route.ts` | requireAdmin |
| `src/app/api/admin/contact/[id]/read/route.ts` | requireAdmin |
| `src/app/api/admin/contact/bulk-update/route.ts` | requireAdmin |
| `src/app/api/admin/packages/cache-status/route.ts` | requireAdmin |
| `src/app/api/admin/orders/backfill-costs/route.ts` | requireAdmin |
| `src/app/api/admin/pages/sync/route.ts` | requireAdmin |
| `src/app/api/admin/users/route.ts` | requireAdmin |
| `src/app/api/admin/update-phase7-articles/route.ts` | requireAdmin |
| `src/app/api/orders/by-transaction/[transactionId]/route.ts` | strip credentials |
| `src/app/api/account/register/route.ts` | block guest takeover |
| `src/app/api/packages/route.ts` | remove wholesalePrice |
| `src/app/api/contact/route.ts` | HTML escape |
| `src/lib/rateLimit.ts` | add error log |
