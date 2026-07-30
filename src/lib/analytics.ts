/**
 * GA4 ecommerce event helpers.
 * gtag is loaded by CookieConsentProvider only after analytics/marketing consent —
 * every helper here is a silent no-op when gtag is absent (no consent / SSR).
 */

import type { Plan } from '@/types';

export interface GaItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
}

const CURRENCY = 'USD';

function gtagSafe(eventName: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;
  try {
    gtag('event', eventName, params);
  } catch {
    // analytics must never break the page
  }
}

export function planToGaItem(plan: Plan, destinationName: string): GaItem {
  return {
    item_id: plan.id,
    item_name: plan.name,
    price: plan.price,
    quantity: 1,
    item_category: destinationName,
  };
}

export function trackViewItemList(listId: string, items: GaItem[]): void {
  gtagSafe('view_item_list', { item_list_id: listId, items: items.slice(0, 10) });
}

export function trackViewItem(item: GaItem): void {
  gtagSafe('view_item', { currency: CURRENCY, value: item.price, items: [item] });
}

export function trackAddToCart(item: GaItem): void {
  gtagSafe('add_to_cart', { currency: CURRENCY, value: item.price, items: [item] });
}

export function trackBeginCheckout(items: GaItem[], value: number): void {
  gtagSafe('begin_checkout', { currency: CURRENCY, value, items });
}

export function trackAddPaymentInfo(items: GaItem[], value: number): void {
  gtagSafe('add_payment_info', { currency: CURRENCY, value, payment_type: 'paddle', items });
}

/** Fires once per transaction — success page polls and re-renders. */
export function trackPurchase(transactionId: string, items: GaItem[], value: number): void {
  if (typeof window === 'undefined') return;
  const key = `ga_purchase_${transactionId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // sessionStorage unavailable (private mode) — fire anyway
  }
  gtagSafe('purchase', { transaction_id: transactionId, currency: CURRENCY, value, items });
}
