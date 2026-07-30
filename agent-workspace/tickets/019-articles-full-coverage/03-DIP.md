# DIP — Ticket 019: Articles Full Language Coverage

## Legend: [ ] pending · [✅] done

## Phase A — Infrastructure

- [✅] **A.1** Ticket folder + PRD/ADD/DIP
- [✅] **A.2** `slug-to-dest.mjs` + short-template builder + `apply-short-template.mjs` (dry-run + apply)
- [✅] **A.3** Rerun doc: `node scripts/article-locale-fills/apply-short-template.mjs --dry-run` → apply

## Phase B — Short template (25 Part7-style articles)

- [✅] **B.1** `short-template-data.mjs` — 25 slugs, p4 EN/AR + titles
- [✅] **B.2** Applied **39** locale rows (EN and/or AR per gap); skipped 11 already filled
- [✅] **B.3** `p4-he-extracted.json` + `extract-p4-he.mjs`

## Phase C — Remaining gaps (non-template)

- [✅] **C.1** AR bulk: `apply-ar-json-bulk.mjs` + `ar-fillers.mjs` (ratio ≥0.78 vs EN); **48** slugs applied
- [✅] **C.2** HE bulk: `apply-he-bulk.mjs` + `he-special.mjs` + `he-fillers.mjs` — **80** Hebrew locales
- [✅] **C.3** EN bulk: `apply-en-bulk.mjs` + `en-fillers.mjs` — **52** English locales
- [✅] **C.4** AR remaining: `apply-ar-gaps.mjs` — **20** Arabic locales (after EN fill)

## Verification

- [✅] `node scripts/coverage-table.mjs` → **0** gaps (181 articles, all locales PUBLISHED)
- [ ] Spot-check `/en`, `/he`, `/ar` for sample slugs in admin and live site
