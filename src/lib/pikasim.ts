/**
 * PikaSim reseller API client — phone plans (number + minutes + SMS). Ticket 042.
 * Docs: https://pikasim.com/reseller/api-docs
 *
 * Kept deliberately parallel to `esimaccess.ts`: a thin fetch wrapper, typed responses, nothing
 * about our own pricing. Prices here are PikaSim's, in cents; what we charge is decided in
 * `phone-plans.ts`.
 *
 * Orders are asynchronous on PikaSim's side. Their webhook cannot reach a machine without a public
 * address, so fulfilment polls `GET /orders/:id` instead — the same approach the eSIMaccess path
 * already takes with `getEsimProfileWithRetry`.
 */

import { noteResponse, takeSlot } from '@/lib/pikasim-limiter';

const BASE_URL = 'https://pikasim.com/api/v1/reseller';

/** One catalogue fetch per hour per server instance. The list changes rarely and is small. */
const CATALOG_TTL_MS = 60 * 60 * 1000;
/** Pages wait this long for the catalogue at most; checkout and fulfilment keep the full timeout. */
const CATALOG_PAGE_TIMEOUT_MS = 6000;
/** After a failed fetch, pages stop asking PikaSim for this long and use what they have (or nothing). */
const CATALOG_RETRY_AFTER_MS = 60 * 1000;

export class PikaSimError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = 'PikaSimError';
  }
}

export function isPikaSimConfigured(): boolean {
  return Boolean(process.env.PIKASIM_API_KEY?.trim());
}

/** A request our own limiter held back: it never reached PikaSim. Treated like PikaSim's 429. */
export const LOCAL_THROTTLE = 'LOCAL_THROTTLE';

/** Rate-limited, held back, or the key itself refused: retrying straight away only makes it worse. */
export function isStopError(e: unknown): boolean {
  return e instanceof PikaSimError && (e.status === 429 || e.status === 401 || e.status === 403);
}

async function call<T>(method: 'GET' | 'POST', endpoint: string, body?: unknown, timeoutMs = 15000): Promise<T> {
  const key = process.env.PIKASIM_API_KEY?.trim();
  if (!key) throw new PikaSimError('PIKASIM_API_KEY is not set', 500);

  // Every PikaSim request goes through the shared limiter (see pikasim-limiter.ts).
  const heldBack = await takeSlot();
  if (heldBack) throw new PikaSimError(`PikaSim request held back: ${heldBack}`, 429, LOCAL_THROTTLE);

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { 'X-API-Key': key, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => null)) as
    | { success: boolean; data?: T; error?: string; code?: string }
    | null;
  await noteResponse(res.status, res.headers, json?.error ?? '');
  if (!res.ok || !json?.success) {
    throw new PikaSimError(`PikaSim API error: ${json?.error || res.statusText}`, res.status, json?.code);
  }
  return json.data as T;
}

// ─── Types ───────────────────────────────────────────────────

export interface PikaPackage {
  packageCode: string;
  name: string;
  /** "US", "EU", "GL" or a country code for single-country plans. */
  location: string;
  locationCode: string | null;
  region: string | null;
  isGlobalPackage: boolean;
  locationNetworkList?: { locationName: string; locationCode?: string; operatorList?: { operatorName: string; networkType?: string }[] }[];
  volume: number;
  volumeGB: number;
  duration: number;
  durationUnit: string;
  speed: string;
  /** Our cost, in cents. */
  price: number;
  suggestedRetailPrice: number;
  planType: string;
  hasVoice: boolean;
  hasSms: boolean;
  /** -1 = unlimited. */
  voiceMinutes: number;
  smsCount: number;
  phoneNumberIncluded: boolean;
  nonRefundable?: boolean;
  requiresActivationDate?: boolean;
  activeType: number;
  description: string;
}

export interface PikaAccount {
  companyName: string;
  status: string;
  balance: number;
  balanceFormatted: string;
  totalOrders: number;
}

export interface PikaOrder {
  orderId: string;
  externalOrderId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  packageCode: string;
  price: number;
  esim?: PikaEsimSummary;
  message?: string;
  duplicate?: boolean;
}

export interface PikaEsimSummary {
  iccid: string;
  qrCodeUrl?: string;
  activationCode?: string;
  shortUrl?: string;
  msisdn?: string;
  status?: string;
}

export interface PikaEsim extends PikaEsimSummary {
  smdpStatus?: string;
  totalData?: number;
  usedData?: number;
  remainingData?: number;
  expireTime?: string;
}

// ─── Catalogue ───────────────────────────────────────────────

let catalogCache: { ts: number; list: PikaPackage[] } | null = null;
let catalogFailedAt = 0;
let inflight: Promise<PikaPackage[]> | null = null;

/**
 * Every phone plan PikaSim sells, cached in memory. Throws only when there is no cache to fall back on.
 *
 * `patient` is for checkout and fulfilment, which must always try. Page renders are not: every page
 * with a phone section awaits this, so while PikaSim hangs they would each wait on it. They give up
 * sooner, and for a minute after a failure they do not ask at all.
 */
export async function getPhoneCatalog({ patient = false }: { patient?: boolean } = {}): Promise<PikaPackage[]> {
  if (catalogCache && Date.now() - catalogCache.ts < CATALOG_TTL_MS) return catalogCache.list;
  if (!patient && Date.now() - catalogFailedAt < CATALOG_RETRY_AFTER_MS) {
    if (catalogCache) return catalogCache.list;
    throw new PikaSimError('PikaSim catalogue unavailable (failed less than a minute ago)', 503);
  }
  if (inflight) return inflight;

  const timeoutMs = patient ? undefined : CATALOG_PAGE_TIMEOUT_MS;
  inflight = (async () => {
    try {
      const list: PikaPackage[] = [];
      for (let page = 1; page <= 10; page++) {
        const data = await call<{ packages: PikaPackage[]; pagination: { pages: number } }>(
          'GET',
          `/packages?type=phone&limit=200&page=${page}`,
          undefined,
          timeoutMs,
        );
        list.push(...(data.packages ?? []));
        if (page >= (data.pagination?.pages ?? 1)) break;
      }
      catalogCache = { ts: Date.now(), list };
      catalogFailedAt = 0;
      return list;
    } catch (e) {
      catalogFailedAt = Date.now();
      // A stale list is better than an empty phone tab during a PikaSim hiccup.
      if (catalogCache) return catalogCache.list;
      throw e;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function clearPhoneCatalogCache(): void {
  catalogCache = null;
}

// ─── Account, orders, eSIMs ──────────────────────────────────

export async function getPikaAccount(): Promise<PikaAccount> {
  return call<PikaAccount>('GET', '/account');
}

/**
 * `externalOrderId` is our own order id. PikaSim treats it as an idempotency key: a retry with the
 * same value returns the original order instead of charging again.
 */
export async function createPikaOrder(packageCode: string, externalOrderId: string): Promise<PikaOrder> {
  return call<PikaOrder>('POST', '/orders', { packageCode, externalOrderId }, 30000);
}

export async function getPikaOrder(orderId: string): Promise<PikaOrder> {
  return call<PikaOrder>('GET', `/orders/${encodeURIComponent(orderId)}`);
}

export async function getPikaEsim(iccid: string): Promise<PikaEsim> {
  return call<PikaEsim>('GET', `/esims/${encodeURIComponent(iccid)}`);
}

export interface PikaTopupOption {
  packageCode: string;
  name: string;
  volumeGB: number;
  duration: number;
  /** Our cost in cents (already net of the reseller discount). */
  price: number;
  priceFormatted?: string;
  voiceMinutes?: number;
  smsCount?: number;
}

/**
 * What an existing eSIM can be renewed with. For a US or global phone plan a top-up extends the
 * validity and keeps the same phone number; country plans return nothing (single-cycle).
 */
export async function getPikaTopupOptions(iccid: string): Promise<PikaTopupOption[]> {
  const data = await call<{ topupPackages?: PikaTopupOption[] }>('GET', `/esims/${encodeURIComponent(iccid)}/topup-options`);
  return data.topupPackages ?? [];
}

/**
 * Renew an eSIM. The cost comes out of the wallet; PikaSim refunds it automatically if the top-up
 * fails. `externalOrderId` (our order id) makes a retry replay the original top-up, never charge twice.
 * The response shape is not documented beyond success, so every field is optional.
 */
export async function createPikaTopup(
  iccid: string,
  packageCode: string,
  externalOrderId: string,
): Promise<{ orderId?: string; topupId?: string; id?: string; status?: string; expireTime?: string; duplicate?: boolean }> {
  return call('POST', `/esims/${encodeURIComponent(iccid)}/topup`, { packageCode, externalOrderId }, 30000);
}

/**
 * Cancel an eSIM that has not been installed, for a refund to the wallet. PikaSim refuses country
 * phone plans outright (`PLAN_NON_REFUNDABLE`) and sends US/global phone plans to a support ticket;
 * either way the error comes back as a `PikaSimError` the admin can read.
 */
export async function cancelPikaEsim(iccid: string): Promise<{ refundFormatted?: string; message?: string }> {
  return call('POST', `/esims/${encodeURIComponent(iccid)}/cancel`);
}

/**
 * The docs show the eSIM as `esim` on the webhook and only say "including eSIM details" for
 * `GET /orders/:id`, so accept the list form too rather than wait forever on a renamed field.
 */
export function esimOfOrder(order: PikaOrder): PikaEsimSummary | null {
  const loose = order as PikaOrder & { esims?: PikaEsimSummary[] };
  const e = order.esim ?? loose.esims?.[0] ?? null;
  return e?.iccid && (e.qrCodeUrl || e.activationCode) ? e : null;
}

/** Poll an order until PikaSim has attached the eSIM, or give up and let the caller keep it PROCESSING. */
/**
 * Poll a new order until its eSIM is ready. Exponential backoff (first delay doubling, capped at 8 s)
 * and a hard cap on attempts; a rate limit, a held-back request or a refused key ends it at once —
 * the order is saved, and a later Retry picks the eSIM up without buying another.
 */
export async function waitForPikaEsim(orderId: string, attempts = 5, firstDelayMs = 2000): Promise<PikaEsimSummary | null> {
  let delay = firstDelayMs;
  for (let i = 0; i < attempts; i++) {
    try {
      const order = await getPikaOrder(orderId);
      const esim = esimOfOrder(order);
      if (esim) return esim;
      if (order.status === 'failed') return null;
    } catch (e) {
      if (isStopError(e)) return null;
      /* anything else is transient — try again after the delay */
    }
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, 8000);
    }
  }
  return null;
}

/** "LPA:1$smdp.example$ABC123" → both halves. */
export function splitLpa(activationCode: string | undefined): { smdpAddress: string; activationCode: string } {
  const parts = (activationCode ?? '').split('$');
  if (parts.length >= 3) return { smdpAddress: parts[1], activationCode: parts[2] };
  return { smdpAddress: '', activationCode: activationCode ?? '' };
}

/**
 * The phone number, but only once it is real. PikaSim may return a placeholder MSISDN until the
 * traveller installs and activates the eSIM, so a number on a profile that never reached the
 * network is not shown to anyone.
 */
export function confirmedMsisdn(esim: Pick<PikaEsim, 'msisdn' | 'status'> | null | undefined): string | null {
  if (!esim?.msisdn) return null;
  const s = (esim.status ?? '').toUpperCase();
  return s === 'IN_USE' || s === 'ENABLED' || s === 'USED_UP' ? esim.msisdn : null;
}
