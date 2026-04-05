# ADD — Ticket 011: TypeScript Strict Cleanup

## Architecture Principles Applied
- **Minimal footprint**: Fix type annotations only; no logic changes
- **Existing patterns**: Follow patterns already in the codebase (explicit types over `any`)
- **Safety**: No schema changes, no new dependencies, no new files

## Error Categories & Fixes

### Category A — tsconfig exclusion (21 prisma errors)
**File:** `tsconfig.json`
**Change:** Add `prisma/seed*.ts` and `prisma/scripts/*.ts` to `exclude[]`
**Rationale:** Seed scripts are one-time migration utilities, not compiled into the app bundle. They reference stale Prisma schema fields (pre-migration) that no longer exist.

### Category B — Generic type fix in `orderFilters.ts` (14 AdminOrdersClient errors)
**File:** `src/app/admin/orders/orderFilters.ts`
**Change:** Make `applyOrderFilters` generic: `function applyOrderFilters<T extends OrderForFilter>(orders: T[], ...): T[]`
**Rationale:** `Order` (full type with `errorMessage`, `iccid`, etc.) is a superset of `OrderForFilter`. Making the function generic preserves the concrete type through the filter call, eliminating the cast at the call site.

### Category C — Next.js 15 route handler params (8 .next/types/ errors)
**Files:**
- `src/app/api/account/orders/[id]/retry/route.ts`
- `src/app/api/admin/orders/[id]/retry/route.ts`
- `src/app/api/admin/seo/[id]/route.ts`
**Change:** Wrap `params` in `Promise<{id: string}>` and `await` it inside the handler (Next.js 15 dynamic API)
**Rationale:** Next.js 15 changed dynamic route params to be async Promises.

### Category D — Implicit `any` in map/reduce callbacks (TS7006)
**Files:** ~20 files
**Change:** Add explicit type annotations to `.map()`, `.reduce()`, `.filter()` callbacks where TypeScript cannot infer the type
**Rationale:** Strict mode requires no implicit `any`. Quick surgical fixes.

### Category E — Type mismatches (TS2339, TS2345, TS2352, TS2740)
**Files:** Various
**Change:** Correct interface definitions, widen/narrow types as needed, use proper casts where intentional
**Rationale:** Type-level accuracy improves reliability and IDE tooling.

## Files Modified
| File | Change Type |
|------|------------|
| `tsconfig.json` | Add exclusions for seed scripts |
| `src/app/admin/orders/orderFilters.ts` | Generic type on `applyOrderFilters` |
| `src/app/api/account/orders/[id]/retry/route.ts` | Async params |
| `src/app/api/admin/orders/[id]/retry/route.ts` | Async params |
| `src/app/api/admin/seo/[id]/route.ts` | Async params |
| ~20 other `src/` files | Explicit type annotations |
| `next.config.mjs` | Remove `ignoreBuildErrors: true` |

## Risk Assessment
- **Low**: All changes are type-level only (no runtime behavior change)
- **Low**: Seed scripts excluded from tsconfig — they're not in the build path anyway
- **Medium**: `params` async change in Next.js 15 — already required by the framework, not a behavior change
