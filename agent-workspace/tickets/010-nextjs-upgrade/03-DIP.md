# DIP — Next.js Security Upgrade

## Steps

- [ ] Fix `src/app/admin/audit-log/page.tsx` — searchParams async pattern
- [ ] `npm install next@15.5.14`
- [ ] `npm audit fix` for remaining dev deps
- [ ] `npm run build` — must pass
- [ ] `git push` → Vercel deploy
- [ ] Verify `npm audit` shows 0 high/critical for next package
- [ ] Smoke test: homepage, checkout, admin panel, 2FA
