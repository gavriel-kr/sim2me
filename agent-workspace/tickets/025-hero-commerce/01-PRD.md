# Ticket 025 — Commerce-First Hero (PRD)

## Background
The hero (top fold) is brand-led: generic headline, empty search box as the only funnel entry, no price anywhere, English-only phone mockup with fake packages. Our #1 differentiator (30–65% cheaper than Airalo, proven in the July 2026 competitive analysis) is invisible above the fold. Everything below the hero (Hot Deals, For You — ticket 024) stays unchanged.

## Goals
Make the hero do ecommerce within 5 seconds of landing, reusing only existing infrastructure (no new backend, no new data).

## Requirements

### R1 — Copy (he/en/ar)
- Headline with price anchor: "אינטרנט בכל העולם. מ-$1.40. בלי דמי נדידה." (+ EN/AR equivalents)
- Subtitle = pain-relief, not mechanism (approved "version A"): "נוחתים מחוברים — בלי להחליף סים ובלי חשבון מפתיע כשחוזרים הביתה."
- No QR/scanning language — some devices install without scanning.

### R2 — Destination quick-chips
- Up to 6 chips under the search box: flag + localized country name + "from $X".
- Source: existing destinations query (admin-featured first — same data as "Popular destinations" section). One click → destination page.

### R3 — Personalization chip
- Returning visitor with a recently-viewed destination (localStorage from ticket 024) sees a "Continue to {destination}?" chip. Hidden otherwise.

### R4 — Hot-deal teaser
- Small chip near the CTA with today's top deal ("{destination} {data} at $Y instead of $Z"), anchor-scrolls to the Hot Deals section below. Hidden when no deals.

### R5 — Phone mockup sells
- Replace the 3 hardcoded English fake eSIM cards with today's real hot deals (localized names, real prices, discount badge). Falls back to current static content when no deals exist.
- Localize the phone chrome text (currently "Welcome back / Your eSIMs / ACTIVE").

### R6 — Micro-trust row
- Under the CTA: installed in minutes · secure checkout · 24/7 support (reuse existing trust translations where possible).

## Non-goals
- No changes to Hot Deals / For You / Popular destinations sections (explicit user instruction).
- No product grid inside the hero.
- No deployment — local only.

## Success criteria
- Price visible above the fold in all 3 locales; zero-typing path into the funnel (chips); returning visitors see their destination; hero reflects live deals.
