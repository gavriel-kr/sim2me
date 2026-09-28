/**
 * Ticket 042 — one place that knows how to describe, price and buy each kind of product.
 *
 * The Paddle webhook, the admin's internal sale and both retry buttons used to call eSIMaccess
 * directly. With day passes and PikaSim phone plans in the mix they would each have needed the same
 * three-way branch, so the branch lives here and they call it.
 *
 * Plain eSIMaccess packages behave exactly as before: the same lookup, the same purchase call, the
 * same profile retry.
 */

import {
  getBalance,
  getEsimProfileWithRetry,
  getPackages,
  purchasePackage,
  formatDataVolume,
  type EsimPackage,
} from '@/lib/esimaccess';
import { getDbCachedPackages } from '@/lib/packagesCache';
import { prisma } from '@/lib/prisma';
import { createPikaOrder, createPikaTopup, getPikaAccount, splitLpa, waitForPikaEsim } from '@/lib/pikasim';
import { getRenewalContext, getRenewalOptions } from '@/lib/renewal';
import { getPhoneDealPrice } from '@/lib/phone-deals';
import { getPhonePlanById } from '@/lib/phone-catalog';
import { parseProductId, isValidProductRef, type ProductRef } from '@/lib/product-id';
import { unlimitedCostUsd, unlimitedPriceUsd, UNLIMITED_DAILY_GB } from '@/lib/unlimited';

export type Supplier = 'eSIMaccess' | 'PikaSim';

export interface ProductDescription {
  ref: ProductRef;
  supplier: Supplier;
  /** Recorded on the order and shown in admin, in English like the supplier names. */
  packageName: string;
  destination: string;
  dataAmount: string;
  validity: string;
  /** What the supplier charges us. Undefined only when an eSIMaccess package cannot be resolved. */
  supplierCostUsd: number | undefined;
  /**
   * What we charge, for the product kinds whose price is computed rather than stored.
   * Null for plain eSIMaccess packages, whose price keeps coming from the existing
   * override / catalogue / hot-deal logic in checkout.
   */
  serverPriceUsd: number | null;
  /** False when the admin has hidden it or it cannot be sold yet. */
  purchasable: boolean;
}

export interface ProvisionedProfile {
  iccid: string;
  qrCodeUrl: string | null;
  smdpAddress: string;
  activationCode: string;
}

export interface SupplierOrder {
  /** Stored in `Order.esimOrderId`. For PikaSim this is their order id. */
  supplierOrderNo: string;
  supplierTxnId: string;
}

async function findEsimPackage(code: string, preferCache: boolean): Promise<EsimPackage | undefined> {
  if (preferCache) {
    const cached = await getDbCachedPackages().catch(() => null);
    const hit = cached?.packageList?.find((p) => p.packageCode === code);
    if (hit) return hit;
  }
  const { packageList } = await getPackages();
  return packageList?.find((p) => p.packageCode === code);
}

export async function describeProduct(planId: string): Promise<ProductDescription | null> {
  const ref = parseProductId(planId);
  if (!isValidProductRef(ref)) return null;

  if (ref.kind === 'esim') {
    let pkg: EsimPackage | undefined;
    try {
      pkg = await findEsimPackage(ref.code, false);
    } catch (e) {
      console.warn('[fulfillment] Could not resolve package details', e);
    }
    return {
      ref,
      supplier: 'eSIMaccess',
      packageName: pkg?.name || planId,
      destination: pkg ? pkg.location || pkg.locationCode || '' : '',
      dataAmount: pkg?.volume != null ? formatDataVolume(pkg.volume) : '',
      validity: pkg?.duration != null ? `${pkg.duration} days` : '',
      supplierCostUsd: pkg?.price != null ? pkg.price / 10000 : undefined,
      serverPriceUsd: null,
      purchasable: true,
    };
  }

  if (ref.kind === 'daypass') {
    const pkg = await findEsimPackage(ref.code, true);
    if (!pkg || pkg.dataType !== 2 || !(pkg.price > 0)) return null;
    const hidden = await prisma.packageOverride
      .findUnique({ where: { packageCode: ref.code }, select: { visible: true } })
      .catch(() => null);
    const perDay = pkg.price / 10000;
    // "Japan 2GB/Day FUP1Mbps" → "Japan": the supplier's `location` field is often just the code.
    const where = pkg.name.replace(/\s+\d.*$/, '').trim() || pkg.location || pkg.locationCode || '';
    return {
      ref,
      supplier: 'eSIMaccess',
      packageName: `${where} Unlimited ${ref.days} ${ref.days === 1 ? 'day' : 'days'} (${UNLIMITED_DAILY_GB}GB/day)`,
      destination: where,
      dataAmount: `Unlimited (${UNLIMITED_DAILY_GB}GB/day)`,
      validity: `${ref.days} days`,
      supplierCostUsd: unlimitedCostUsd(perDay, ref.days),
      serverPriceUsd: unlimitedPriceUsd(perDay, ref.days),
      purchasable: hidden?.visible !== false,
    };
  }

  if (ref.kind === 'renewal') {
    // Renewal of an existing US/global phone eSIM: same number, more time. Priced like the same
    // package sold new; only offered while the base order is completed and renewable.
    const ctx = await getRenewalContext(ref.orderId);
    if (!ctx) return null;
    const option = (await getRenewalOptions(ctx)).find((o) => o.code === ref.code);
    if (!option) return null;
    const where = ctx.region === 'us' ? 'USA' : ctx.region === 'global' ? 'Global' : 'Phone';
    return {
      ref,
      supplier: 'PikaSim',
      packageName: `Renewal · ${where} phone number · ${option.dataGb}GB · ${option.days} days (order ${ctx.baseOrderNo})`,
      destination: where,
      dataAmount: `${option.dataGb} GB`,
      validity: `${option.days} days`,
      supplierCostUsd: option.costUsd,
      serverPriceUsd: option.priceUsd,
      purchasable: ctx.renewable,
    };
  }

  const plan = await getPhonePlanById(planId);
  if (!plan) return null;
  const where =
    plan.region === 'us' ? 'USA' : plan.region === 'europe' ? 'Europe' : plan.region === 'global' ? 'Global' : plan.numberCountry;
  const minutes = plan.voiceMinutes < 0 ? 'unlimited min' : `${plan.voiceMinutes} min`;
  const sms = plan.sms < 0 ? 'unlimited SMS' : `${plan.sms} SMS`;
  return {
    ref,
    supplier: 'PikaSim',
    packageName: `${where} phone number ${plan.dialCode} · ${plan.dataGb}GB · ${minutes} · ${sms}`,
    destination: where,
    dataAmount: `${plan.dataGb} GB`,
    validity: `${plan.days} days`,
    supplierCostUsd: plan.costUsd,
    // Today's phone deal (ticket 042) can only lower the price, the same rule as the eSIM deals.
    serverPriceUsd: Math.min(plan.priceUsd, (await getPhoneDealPrice(planId).catch(() => null)) ?? Infinity),
    purchasable: plan.visible && !plan.requiresActivationDate,
  };
}

/**
 * Place the order with the supplier — the step that spends money. Callers record the returned
 * supplier order number *before* waiting for the profile, exactly as the webhook always did, so a
 * retry can only ever re-fetch and never buy twice.
 *
 * `orderRef` is our own order id. PikaSim also treats it as an idempotency key, so even a repeated
 * call for the same order returns the original PikaSim order instead of charging again.
 */
export async function placeSupplierOrder(planId: string, orderRef: string): Promise<SupplierOrder> {
  const ref = parseProductId(planId);
  if (!isValidProductRef(ref)) throw new Error(`Invalid product id: ${planId}`);

  if (ref.kind === 'pika') {
    const order = await createPikaOrder(ref.code, orderRef);
    return { supplierOrderNo: order.orderId, supplierTxnId: orderRef };
  }

  if (ref.kind === 'renewal') {
    const ctx = await getRenewalContext(ref.orderId);
    if (!ctx?.iccid) throw new Error('The eSIM to renew has no ICCID');
    if (!ctx.renewable) throw new Error('This eSIM cannot be renewed');
    const topup = await createPikaTopup(ctx.iccid, ref.code, orderRef);
    return { supplierOrderNo: topup.topupId || topup.orderId || topup.id || `topup-${orderRef}`, supplierTxnId: orderRef };
  }

  const purchase = await purchasePackage(ref.code, 1, ref.kind === 'daypass' ? ref.days : undefined);
  return { supplierOrderNo: purchase.orderNo, supplierTxnId: purchase.transactionId };
}

/**
 * Wait for the eSIM of an order the supplier already has. Used right after `placeSupplierOrder` and
 * by the retry buttons; it never buys anything. Null when the supplier has not produced it yet.
 */
export async function awaitProfile(planId: string, supplierOrderNo: string, patient = true): Promise<ProvisionedProfile | null> {
  const ref = parseProductId(planId);
  if (ref.kind === 'renewal') {
    // A renewal adds time to the eSIM the customer already has: its install details do not change.
    const ctx = await getRenewalContext(ref.orderId);
    return ctx?.iccid
      ? { iccid: ctx.iccid, qrCodeUrl: ctx.qrCodeUrl, smdpAddress: ctx.smdpAddress ?? '', activationCode: ctx.activationCode ?? '' }
      : null;
  }
  if (ref.kind === 'pika') {
    // Backoff 2 s, 4 s, 8 s, 8 s (about 22 s) in the webhook; 2 s, 4 s on a retry. Stops at once on a rate limit.
    const esim = await waitForPikaEsim(supplierOrderNo, patient ? 5 : 3, 2000);
    return esim ? pikaProfile(esim) : null;
  }
  const profileResult = await getEsimProfileWithRetry(supplierOrderNo, 5, 5000);
  const first = profileResult?.esimList?.[0];
  return first
    ? { iccid: first.iccid, qrCodeUrl: first.qrCodeUrl || null, smdpAddress: first.smdpAddress, activationCode: first.activationCode }
    : null;
}

/** Prepaid balance at the supplier that sells this product, in USD. */
export async function supplierBalanceUsd(planId: string): Promise<number> {
  const kind = parseProductId(planId).kind;
  if (kind === 'pika' || kind === 'renewal') {
    const account = await getPikaAccount();
    return (account.balance ?? 0) / 100;
  }
  const { balance } = await getBalance();
  return (balance ?? 0) / 10000;
}

function pikaProfile(esim: { iccid: string; qrCodeUrl?: string; activationCode?: string }): ProvisionedProfile {
  const lpa = splitLpa(esim.activationCode);
  return { iccid: esim.iccid, qrCodeUrl: esim.qrCodeUrl ?? null, smdpAddress: lpa.smdpAddress, activationCode: lpa.activationCode };
}
