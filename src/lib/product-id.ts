/**
 * Ticket 042 — one id for everything a cart can hold.
 *
 * Until now a plan id was an eSIMaccess package code and nothing else, and that string travels a long
 * way: the cart, Paddle's `custom_data`, the webhook, `Order.packageCode`, the admin retry buttons.
 * Two new kinds of product have to ride the same rails without a schema change, so the kind is
 * written into the id itself:
 *
 *   CKH491                         an eSIMaccess package, exactly as before
 *   dp:JP_2_Daily:7                an eSIMaccess day pass bought for 7 days ("unlimited" tab)
 *   pk:change-plus-7days-1gb       a PikaSim phone plan (number, minutes, SMS)
 *   rn:<orderId>:<topupCode>       a renewal of that phone plan's eSIM — same number, more time
 *
 * Every legacy id parses as `esim`, so orders written before this ticket read back unchanged.
 */

export type ProductRef =
  | { kind: 'esim'; code: string }
  | { kind: 'daypass'; code: string; days: number }
  | { kind: 'pika'; code: string }
  /** `orderId` is our order that holds the eSIM being renewed; `code` is a PikaSim top-up package. */
  | { kind: 'renewal'; orderId: string; code: string };

const DAYPASS_PREFIX = 'dp:';
const PIKA_PREFIX = 'pk:';
const RENEWAL_PREFIX = 'rn:';

/** The only day counts a day pass is sold in. eSIMaccess itself accepts 1–365. */
export const DAYPASS_MIN_DAYS = 1;
export const DAYPASS_MAX_DAYS = 30;

export function dayPassId(code: string, days: number): string {
  return `${DAYPASS_PREFIX}${code}:${days}`;
}

export function pikaId(code: string): string {
  return `${PIKA_PREFIX}${code}`;
}

export function renewalId(orderId: string, topupCode: string): string {
  return `${RENEWAL_PREFIX}${orderId}:${topupCode}`;
}

export function parseProductId(id: string): ProductRef {
  if (id.startsWith(DAYPASS_PREFIX)) {
    const rest = id.slice(DAYPASS_PREFIX.length);
    // The code may not contain ':' in practice, but split on the last one so it never matters.
    const cut = rest.lastIndexOf(':');
    const code = cut > 0 ? rest.slice(0, cut) : '';
    const days = cut > 0 ? Number(rest.slice(cut + 1)) : NaN;
    if (code && Number.isInteger(days) && days >= DAYPASS_MIN_DAYS && days <= DAYPASS_MAX_DAYS) {
      return { kind: 'daypass', code, days };
    }
    // A malformed day-pass id must never fall through to a plain eSIMaccess purchase.
    return { kind: 'daypass', code: '', days: 0 };
  }
  if (id.startsWith(PIKA_PREFIX)) {
    return { kind: 'pika', code: id.slice(PIKA_PREFIX.length) };
  }
  if (id.startsWith(RENEWAL_PREFIX)) {
    // Order ids are cuids (no ':'); the top-up code is everything after the first ':'.
    const rest = id.slice(RENEWAL_PREFIX.length);
    const cut = rest.indexOf(':');
    return cut > 0 ? { kind: 'renewal', orderId: rest.slice(0, cut), code: rest.slice(cut + 1) } : { kind: 'renewal', orderId: '', code: '' };
  }
  return { kind: 'esim', code: id };
}

export function isValidProductRef(ref: ProductRef): boolean {
  if (ref.kind === 'daypass') return ref.code.length > 0 && ref.days >= DAYPASS_MIN_DAYS;
  if (ref.kind === 'renewal') return ref.orderId.length > 0 && ref.code.length > 0;
  return ref.code.length > 0;
}

/** For admin lists: which supplier an order or package belongs to. */
export function supplierOf(id: string): 'eSIMaccess' | 'PikaSim' {
  const kind = parseProductId(id).kind;
  return kind === 'pika' || kind === 'renewal' ? 'PikaSim' : 'eSIMaccess';
}
