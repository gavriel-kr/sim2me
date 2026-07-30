# Ticket 022 — Architectural Design (ADD)

## New module: `src/lib/analytics.ts`

Single tiny client-safe helper; no React context needed:

```ts
type GaItem = { item_id: string; item_name: string; price: number; quantity?: number; item_category?: string };

function gtagSafe(...args: unknown[]): void
  // no-op unless window.gtag exists (loaded by CookieConsentProvider after consent)

export function trackViewItemList(listId: string, items: GaItem[]): void
export function trackViewItem(item: GaItem): void
export function trackAddToCart(item: GaItem, value: number): void
export function trackBeginCheckout(items: GaItem[], value: number): void
export function trackAddPaymentInfo(items: GaItem[], value: number): void
export function trackPurchase(transactionId: string, items: GaItem[], value: number): void
  // sessionStorage key `ga_purchase_${transactionId}` guard
```

All wrappers: `currency: 'USD'`, try/catch swallow, SSR-safe (`typeof window` check).

`planToGaItem(plan, destinationName)` mapper co-located in the module to keep call sites one-liners.

## Call sites (minimal diffs)

| Event | File | Hook point |
|---|---|---|
| view_item_list | `DestinationDetailClient.tsx` | `useEffect` on mount with `initialPlans` (first 10 items) |
| view_item | `PlanDetailClient.tsx` | `useEffect` on mount |
| add_to_cart | `PlanCard.tsx` `handleAddToCart`; `PlanDetailClient.tsx` add handler | after `addItem` |
| begin_checkout | `CheckoutClient.tsx` | on `setStep('traveler')` from cart step |
| add_payment_info | `CheckoutClient.tsx` `onPayWithPaddle` | after validations pass |
| purchase | `SuccessClient.tsx` | when polled order reaches COMPLETED (guarded) |

## Files touched
- `src/lib/analytics.ts` (**new**)
- `src/components/sections/PlanCard.tsx`
- `src/app/[locale]/destinations/[slug]/DestinationDetailClient.tsx`
- `src/app/[locale]/destinations/[slug]/plan/[planId]/PlanDetailClient.tsx`
- `src/app/[locale]/checkout/CheckoutClient.tsx`
- `src/app/[locale]/success/SuccessClient.tsx`

## Backups
Copies in `agent-workspace/tickets/022-funnel-analytics/backup/`.

## Rollback
Delete `analytics.ts`, restore call-site files. Zero data/schema impact.
