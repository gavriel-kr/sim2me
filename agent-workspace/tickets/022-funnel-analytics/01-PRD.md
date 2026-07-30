# Ticket 022 — Funnel Analytics (GA4 Ecommerce Events) (PRD)

## Background

GA4 (`G-Y5BJ7VNNYM`) and GTM (`GTM-NSQKP7XQ`) load after cookie consent (`CookieConsentProvider.tsx`), but the app fires **zero** ecommerce events — no `add_to_cart`, no `begin_checkout`, no `purchase`. We cannot measure funnel drop-off, conversion rate, or ad ROI. This must land **before** merchandising changes (ticket 023) so improvements are provable.

## Requirements

| # | Event | Trigger | Payload |
|---|---|---|---|
| E1 | `view_item_list` | Destination page mount | destination slug as `item_list_id`, first items |
| E2 | `view_item` | Plan detail page mount | item (id, name, price, destination) |
| E3 | `add_to_cart` | Add-to-cart in `PlanCard` / `PlanDetailClient` | item + value |
| E4 | `begin_checkout` | Checkout: continue past cart step | items + value |
| E5 | `add_payment_info` | "Pay now" clicked (before Paddle opens) | items + value |
| E6 | `purchase` | Success page when order confirms `COMPLETED` | `transaction_id`, value, items — deduped per transaction |

## Constraints
- Events fire **only** when analytics consent granted and `gtag` exists — never break the page if absent (site works without consent).
- No new dependencies. One small helper module.
- `purchase` must be idempotent per transaction (sessionStorage guard) — success page polls and re-renders.
- Currency: USD (matches store).

## Success criteria
- With consent granted locally, all six events visible in GA4 DebugView / `dataLayer`.
- Without consent, no errors, no events.
- No visual or behavioral change to any page.

## Out of scope
- GTM container configuration (done in GTM UI, not repo)
- Meta pixel / other vendors
- Server-side tagging
