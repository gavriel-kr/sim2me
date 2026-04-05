# PRD — Ticket 011: TypeScript Strict Cleanup

## Background
Since Next.js 14, the project has been running with `typescript: { ignoreBuildErrors: true }` in `next.config.mjs`. This was a deliberate short-term workaround to unblock deployments while the codebase accumulated 119 TypeScript errors in `src/`, 21 in `prisma/` seed scripts, and 8 in Next.js 15 generated route-handler types.

## Goal
Remove `ignoreBuildErrors: true` and achieve a clean `tsc --noEmit` across all production source files.

## Scope
### In scope
- Fix all 119 TypeScript errors in `src/`
- Fix 8 errors in `.next/types/` (Next.js 15 route-handler `params` typing)
- Exclude `prisma/seed*.ts` and `prisma/scripts/*.ts` from tsconfig (21 errors — stale seed scripts not part of the build)
- Remove `typescript: { ignoreBuildErrors: true }` from `next.config.mjs`

### Out of scope
- Customer-facing 2FA (deferred to Ticket 012 — separate feature with schema + UI changes)
- ESLint strict mode upgrades
- Refactoring non-TS logic

## Success Criteria
- `npx tsc --noEmit` exits with code 0 for `src/` and applicable root files
- Vercel production build succeeds without `ignoreBuildErrors`
- No existing functionality broken
