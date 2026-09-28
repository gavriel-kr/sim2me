# Ticket 042 — Unlimited by days, and eSIMs with a phone number (PRD)

Approved by Gabriel, 2026-09-28, local only. Visual plan: https://claude.ai/artifact/UnimvGeFPj5uMGQ5Rt7gZG

## Problem

1. Too many packages. Destination pages list up to 40+ plans, many duplicates, and competitors
   (Holafly, Airalo) sell by one question: how many days.
2. eSIMaccess day passes (`dataType: 2`, ~46% of the catalogue) were listed as one-day plans and
   bought without `periodNum`, so a "2GB/Day" customer got one day.
3. No way to sell an eSIM with a phone number. eSIMaccess has none (checked in the API and on our 20
   latest profiles: no MSISDN).

## Decisions (Gabriel)

| Topic | Decision |
|---|---|
| Destination page | Three prominent tabs: **Unlimited** (default) · **By GB** · **With a phone number** |
| Unlimited | 2GB/day at full speed, then unlimited at reduced speed; any 1–30 days (stepper + slider) |
| Label | Every data card says "Data only · no phone number" |
| Phone supplier | **PikaSim only** (reseller API, 10% off their retail) — no other suppliers now |
| Phone price | Cost + ~10% net after Paddle, ending .90; plans ≥15% above market hidden by default |
| Global plan | Shown, although ~2× Airalo — it is the only number for most countries |
| Phone tab per country | US → US plans · Europe (36) → French +33 plan + global · local plan countries → local + global · rest → global (≤30 days) |
| Refunds | **No refunds on anything**; one plain line among the terms, not a highlighted warning |
| Homepage | Hero chip + new section selling phone plans; admin "featured" + badge = phone promotions |
| CMS | Full admin view: cost, price, profit, vs market, shown/hidden, badge, featured, sell |
| Work rules | Local only, backups before every change, nothing deployed |

## Out of scope

- Paying for the new products through Paddle (locked until the webhook that knows them is live —
  see ADD §Safety). Test purchases go through the admin internal sale.
- Refund / Terms page text stored in the CMS database (live) — replacement text is in `cms-texts.md`
  for Gabriel to paste after approval.
- Australia phone plan (needs a booked activation date at checkout).
