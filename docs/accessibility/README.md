# Accessibility Compliance — Documentation Index

This folder contains research, compliance mapping, implementation plan, and testing materials for **EU (EAA) and global accessibility compliance**. All claims are backed by official sources where indicated.

## Contents

| Document | Purpose |
|----------|---------|
| [01-RESEARCH-AND-OFFICIAL-SOURCES.md](01-RESEARCH-AND-OFFICIAL-SOURCES.md) | EU EAA, EN 301 549, WCAG 2.2, overlay limitations; **official source links**. |
| [02-COMPLIANCE-TRUTH-TABLE-AND-GLOBAL-MATRIX.md](02-COMPLIANCE-TRUTH-TABLE-AND-GLOBAL-MATRIX.md) | **Compliance Truth Table** (EU) and **Global Compliance Matrix** (US, UK, Canada, Australia). |
| [03-IMPLEMENTATION-PLAN.md](03-IMPLEMENTATION-PLAN.md) | **Site-wide WCAG implementation plan** with file-level actions. |
| [04-ACCESSIBILITY-TOOLBAR-SPEC.md](04-ACCESSIBILITY-TOOLBAR-SPEC.md) | Optional toolbar spec; **toolbar cannot substitute for real conformance**. |
| [05-ACCESSIBILITY-STATEMENT-TEMPLATE.md](05-ACCESSIBILITY-STATEMENT-TEMPLATE.md) | Template text for the **Accessibility Statement** page. |
| [06-COMPLIANCE-MAPPING-TABLE.md](06-COMPLIANCE-MAPPING-TABLE.md) | **WCAG 2.2 AA → where/how** the site meets each criterion (code references). |
| [07-TESTING-CHECKLIST.md](07-TESTING-CHECKLIST.md) | **Testing:** axe, Lighthouse, WAVE; keyboard; screen reader; zoom; contrast; motion. |

## Live artifacts

- **Accessibility Statement page:** `/[locale]/accessibility-statement` (e.g. `/accessibility-statement`, `/he/accessibility-statement`).
- **Skip link:** First focusable element; “Skip to main content” → `#main-content`.
- **Reduced motion:** `prefers-reduced-motion` respected in `src/app/globals.css`.

## Limitations and disclaimer

- **Not legal advice.** Applicability (e.g. microenterprise, sector, member state) and deadlines must be confirmed with legal counsel.
- **No “fully compliant worldwide” claim.** Each jurisdiction has different scope and benchmarks; see the global matrix.
- **Accessibility overlays** do not achieve WCAG conformance; see 01 and 04.
