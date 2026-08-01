# Ticket 027 — Architectural Design (ADD)

> Note: the repo has no `project-standards/architecture.md`. This ADD is written against the architecture as observed in the code, following the conventions used by tickets 023–025.

## Principle: one source of colour

No new dependency, no new table, no new endpoint, no new component. The palette lives in `globals.css` as HSL custom properties, is exposed to Tailwind in `tailwind.config.ts`, and every storefront file consumes it by token name. The only new file is a throwaway preview page that gets deleted at the end.

## Layer 1 — tokens (`src/app/globals.css`, `:root`)

### Changed

| Token | Now | New | Why |
|---|---|---|---|
| `--primary` | `160 84% 39%` | `160 84% 34%` | Deeper green; also resolves the drift with `brand.ts` (`#0d9f6e`) |
| `--secondary` | `155 40% 96%` | `214 20% 96%` | Mint → cool neutral |
| `--accent` | `155 40% 96%` | `214 20% 96%` | Same |
| `--secondary-foreground` | `160 60% 25%` | `218 40% 25%` | Navy ink instead of green ink |
| `--accent-foreground` | `160 60% 25%` | `218 40% 25%` | Same |
| `--foreground` | `220 25% 10%` | `218 35% 12%` | Cooler, navy-leaning ink |
| `--muted-foreground` | `220 10% 46%` | `216 12% 45%` | Matches the cooler neutral ramp |
| `--border` | `220 13% 91%` | `214 18% 90%` | Same |
| `--ring` | `160 84% 39%` | `160 84% 34%` | Follows `--primary` |
| `--shadow-glow` | green glow | `hsl(212 90% 50% / 0.25)` | Used by `SearchDestination` + `FeaturedPlans` hover |

### Added

| Token | Value | ≈ Hex | Role |
|---|---|---|---|
| `--primary-bright` | `160 70% 45%` | `#22C38E` | Green **on navy** — CTA text/fill on dark surfaces |
| `--surface-deep` | `218 45% 12%` | `#111B2C` | Hero, closing band |
| `--surface-raised` | `216 38% 18%` | `#1C2A3F` | Cards/borders on navy |
| `--on-deep` | `0 0% 100%` | `#FFFFFF` | Primary text on navy |
| `--on-deep-muted` | `214 22% 74%` | `#AFB9C8` | Secondary text on navy (≈7.9:1 — passes AA) |
| `--brand-blue` | `212 90% 50%` | `#0D78F2` | Informational accent |
| `--brand-blue-soft` | `212 100% 96%` | `#EBF4FF` | Blue tint on light surfaces |
| `--urgent` | `28 95% 54%` | `#F98A16` | Deals and countdowns, exclusively |

`.dark` block: left untouched. Dark mode has no provider, no toggle, and only three files use `dark:` variants — touching it would be work with no consumer.

### Utility classes

Blast radius verified by grep — each of these has exactly one consumer, so redefining them is contained:

| Utility | Only used by | Change |
|---|---|---|
| `.bg-gradient-hero` | `Hero.tsx:97` | Navy base + blue/green radial wash |
| `.bg-dot-pattern` | `Hero.tsx:99` | Dot colour → blue, tuned for a dark ground |
| `.bg-gradient-cta` | `CTASection.tsx:14` | Navy base + radial wash |
| `.text-gradient` | *(no consumer)* | Update for consistency; nothing depends on it |
| `.glass` | *(no consumer)* | Add a dark counterpart for the hero search field |

Because each gradient has a single consumer, **the gradient change ships in the same phase as its consumer** — never before it. That keeps every stopping point visually coherent instead of leaving a navy background under dark text.

## Layer 2 — Tailwind (`tailwind.config.ts`)

Purely additive: new keys under `theme.extend.colors` so the new tokens are usable as ordinary utilities (`bg-surface-deep`, `text-on-deep-muted`, `text-brand-blue`, `bg-urgent`, `bg-primary-bright`) instead of arbitrary `bg-[hsl(var(--x))]` values. No existing key is renamed or removed, so nothing currently compiled can break.

## Layer 3 — surface rhythm

Dark bookends, light middle:

```
Header            light
Hero              NAVY        ← phase 2
HotDeals … FAQ    light
CTASection        NAVY        ← phase 3
Footer            light  (dark is an optional later phase — see below)
```

The footer is deliberately held back. It renders on every page and leans hard on `text-foreground` / `text-muted-foreground`, which are tuned for light ground; inverting it means threading on-dark tokens through a globally shared component. It is proposed as its own phase after the rest is verified, so it can be judged — and reverted — on its own.

## Layer 4 — colour semantics for the storefront

One rule replaces the current ad-hoc tints:

| Meaning | Token | Replaces |
|---|---|---|
| Action / price / success | `primary`, `primary-bright` on navy | `emerald-500/600/700` |
| Information / spec / neutral chip | `brand-blue`, `brand-blue-soft` | `sky-50/700`, `blue-100/600`, `purple-100/600` |
| Urgency | `urgent` | `orange-*` in deals |
| Warning | `amber-*` — unchanged | — |
| Error | `destructive` — unchanged | — |

Amber and `destructive` stay as they are: they already carry a single, correct meaning.

## Files in scope

**Tokens (2):** `globals.css`, `tailwind.config.ts`

**Storefront (~28):** `Hero`, `CTASection`, `HotDealsSection`, `ForYouSection`, `ValueProps`, `TrustStrip`, `FeaturedPlans`, `FAQSection`, `PlanCard`, `CuratedTierCard`, `SearchDestination`, `StickyHelpButton`, `Header`, `DataUsageCalculator`, `DataUsageModal`, `DestinationsClient`, `DestinationDetailClient`, `PlanDetailClient`, `AccountClient`, `AccountLoginClient`, `CheckoutClient`, `SuccessClient`, `contact/page`, `how-it-works`, `compatible-devices`, `about`, `ArticlesIndexClient`, `ArticleDetail`, `RedirectCountdownButton`, `CookiePreferencesModal`

**Shared primitives (3):** `ui/badge.tsx`, `ui/toast.tsx`, `ui/tooltip.tsx` — each hardcodes emerald and is used across both storefront and admin, so these change last and get checked in both.

**Browser chrome (3):** `layout.tsx` (`viewport.themeColor`), `manifest/route.ts` (`theme_color`), `config/brand.ts` (`primaryColor` / `secondaryColor`)

**Explicitly untouched:** `src/app/admin/**`, `src/lib/email.ts`, `src/lib/update-phase7-articles.ts` (a data script, not UI), `mobile/**`, the `.dark` token block.

## Rollback

Three independent layers, strongest first:

1. **Working tree is clean at `1761d90`.** `git restore .` reverts the entire ticket in one command at any moment.
2. **Per-file backups** in `agent-workspace/tickets/027-navy-palette/backup/`, taken before each file's first edit — matches the convention in tickets 021–025.
3. **Phase boundaries.** Every phase leaves the site in a coherent, shippable state, so a single phase can be reverted without unwinding the others.

## Accessibility

The repo's own compliance table (`docs/accessibility/06-COMPLIANCE-MAPPING-TABLE.md`) already marks contrast as "Partial", so this is a chance to improve rather than regress. Pre-computed for the navy surfaces:

- `--on-deep` on `--surface-deep` ≈ 16:1 — AAA
- `--on-deep-muted` on `--surface-deep` ≈ 7.9:1 — AAA body text
- `--primary-bright` on `--surface-deep` ≈ 6.4:1 — passes as a UI boundary and as large text
- Dark button text `hsl(160 80% 10%)` on `--primary-bright` ≈ 9:1

Two interactions to verify by eye, not by arithmetic: `html.a11y-high-contrast` applies `filter: contrast(1.45)` to the whole document and will deepen the navy further, and `html.a11y-highlight-focus` draws amber `#f59e0b` outlines that must stay visible on navy.

## RTL

Hero and CTA are the only restructured surfaces. Both already use logical properties (`-start-*` / `-end-*`, `text-end`) and are exercised in `he` and `ar`. The radial gradient positions are directional by design and must be checked in RTL — a wash anchored top-right in LTR lands top-left in RTL, which is fine visually but must be confirmed rather than assumed.

## Risk

R1. Presentation only — no auth, payment, order, or data path is touched. The breadth (~30 files) is the risk, which the phase boundaries and per-file backups exist to contain.
