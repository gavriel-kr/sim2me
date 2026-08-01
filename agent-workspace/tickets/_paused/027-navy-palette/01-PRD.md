# Ticket 027 — PRD: Navy Palette + Dark Hero

## Problem

The storefront reads as washed out and "not sharp". Diagnosis from the code, not from taste:

1. **No dark anchor anywhere.** `--primary` is `160 84% 39%` — a genuinely saturated green — but everything it sits on is a pale tint: `.bg-gradient-hero` runs at 96–98% lightness, `.bg-dot-pattern` at 8% opacity, `bg-primary/5` and `bg-emerald-100/60` blobs, and both `--secondary` and `--accent` are mint at `155 40% 96%`. White on mint with green text means the green never gets a contrast partner.
2. **Green carries every job at once** — brand, CTA, price, trust icons, success state, badge borders. ~371 hardcoded colour-class occurrences across 31 storefront files. When one colour means "us" and "buy" and "cheap" and "worked", the eye gets no hierarchy.
3. **Accents are ad-hoc.** Orange for hot deals, amber for warnings, one `blue-100` badge, `sky-50` per-day pill, `purple-100` icon tile — none of it planned, so nothing reads as intentional.
4. **Brand drift.** `src/config/brand.ts` declares `#0d9f6e` (≈ `160 85% 34%`) while `globals.css` uses `160 84% 39%`. Two different greens. `getThemeFromBrand()` in `src/lib/theme/tokens.ts` is dead code — nothing imports it.

## Goal

Repaint the storefront around a deep navy surface with green as the action colour, per the approved dark-hero variant in `/he/design-preview`.

- **G1** Navy becomes the structural colour: hero and closing band go dark; everything between stays light on a cool neutral rather than mint.
- **G2** Green stops being background and becomes the action colour only — CTAs, prices, success. Two shades: `160 84% 34%` on light surfaces, `160 70% 45%` on navy (a single shade either drowns on navy or burns on white).
- **G3** Blue becomes the secondary/informational accent (per-day pill, info tiles, links), replacing the ad-hoc `sky`/`blue`/`purple` tints.
- **G4** Orange becomes urgency, exclusively — hot deals and countdowns, nothing else.
- **G5** Storefront colour moves onto semantic tokens so the palette lives in one file.
- **G6** Every step is individually revertible.

## Non-goals

- **Theme switcher.** Explicitly dropped (2026-07-31). One palette, changed by editing tokens when we want it changed.
- **Admin panel.** `src/app/admin/**` stays green. Not customer-facing; excluding it removes roughly half the surface at zero user cost.
- **Emails.** `src/lib/email.ts` carries inline brand hex. Post-purchase delivery is a critical path — deferred to its own ticket.
- **Mobile app.** `mobile/src/theme/colors.ts` is a separate application.
- **Layout, copy, structure.** Colour and surface only. No section moves, no wording changes, no new sections.
- **People photography and destination imagery** — the next ticket, agreed to follow this one.

## Success criteria

- `/he`, `/en`, `/ar` render the dark hero correctly in both directions with no light-on-light or dark-on-dark text.
- No mint tint remains on the storefront; no raw `emerald-*` outside `src/app/admin/**`.
- Every navy surface passes WCAG AA (4.5:1 body, 3:1 large text and UI boundaries).
- `npx tsc --noEmit`, lint, and `npx next build` all clean.
- Every ticket-025 hero behaviour still works: destination chips, continue-chip, hot-deal chip, live phone mockup, micro-trust row.
- Any phase can be reverted on its own from `backup/`.

## Risk

R1 — presentation only, no auth/payment/data paths touched, but the file surface is wide (~30 files). Local only; deployment is out of scope for this ticket.
