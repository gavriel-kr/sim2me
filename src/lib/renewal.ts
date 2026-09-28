/**
 * Ticket 042 — renewing a phone plan's eSIM so the traveller keeps the same number.
 *
 * PikaSim: "USA and Global phone plans are refillable. Topping up before expiry extends the plan and
 * keeps the same phone number." Country plans (Europe, local numbers) are single-cycle — when they
 * end, a new plan brings a new number — so they are never offered a renewal.
 *
 * A renewal is its own order (`rn:<baseOrderId>:<topupCode>`) that points at the order which sold the
 * eSIM. The base order is always the original `pk:` sale, even when renewing a second time, so every
 * renewal of one number hangs off the same place.
 */

import { prisma } from '@/lib/prisma';
import { getPikaTopupOptions, isPikaSimConfigured } from '@/lib/pikasim';
import { getPhonePlans } from '@/lib/phone-catalog';
import { isRenewableRegion, phonePriceUsd, type PhoneRegion } from '@/lib/phone-plans';
import { parseProductId, renewalId } from '@/lib/product-id';
import { loadPlanWindow, type PlanWindow } from '@/lib/phone-validity';
import { sendRenewalConfirmedEmail, toEmailLocale } from '@/lib/email';

/** A renewal the customer can buy. `costUsd` is server-side only — strip it before sending to a browser. */
export interface RenewalOption {
  id: string;
  code: string;
  name: string;
  dataGb: number;
  days: number;
  voiceMinutes: number | null;
  sms: number | null;
  priceUsd: number;
  costUsd: number;
}

export type PublicRenewalOption = Omit<RenewalOption, 'costUsd'>;

export interface RenewalContext {
  /** The original `pk:` order that sold this eSIM. */
  baseOrderId: string;
  baseOrderNo: string;
  customerId: string | null;
  customerEmail: string;
  customerName: string;
  locale: string | null;
  iccid: string | null;
  region: PhoneRegion | null;
  renewable: boolean;
  /** Always null: PikaSim does not report the number; the customer sees it in the phone's settings. */
  phoneNumber: string | null;
  /** ISO time the current plan ends, computed from our own orders (see phone-validity.ts). */
  expireTime: string | null;
  /** True when counted from the customer's installation date, false when from the purchase date. */
  expireExact: boolean;
  window: PlanWindow | null;
  esimStatus: string | null;
  /** Kept from the base order so a renewal record can show the same install details. */
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
}

/** US numbers are Airalo "Change+", global ones "Discover+" (checked against the catalogue, 2026-09-28). */
function regionFromCode(code: string): PhoneRegion | null {
  if (code.startsWith('change-plus')) return 'us';
  if (code.startsWith('discover+')) return 'global';
  return null;
}

/**
 * Resolve any order of a phone eSIM — the original sale or one of its renewals — to its base order.
 * Database only: PikaSim reports nothing live for phone plans, so it is never asked here.
 */
export async function getRenewalContext(orderId: string): Promise<RenewalContext | null> {
  let order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.packageCode.startsWith('rn:')) {
    const ref = parseProductId(order.packageCode);
    if (ref.kind !== 'renewal') return null;
    order = await prisma.order.findUnique({ where: { id: ref.orderId } });
    if (!order) return null;
  }
  if (!order.packageCode.startsWith('pk:')) return null;

  const code = order.packageCode.slice(3);
  // The renewable families are known from the code; only other plans need the (cached) catalogue.
  const region: PhoneRegion | null =
    regionFromCode(code) ?? (await getPhonePlans().catch(() => [])).find((p) => p.code === code)?.region ?? null;
  const window = await loadPlanWindow(order);

  return {
    baseOrderId: order.id,
    baseOrderNo: order.orderNo,
    customerId: order.customerId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    locale: order.locale,
    iccid: order.iccid,
    region,
    renewable: Boolean(region && isRenewableRegion(region) && order.iccid && order.status === 'COMPLETED'),
    phoneNumber: null,
    expireTime: window?.endsAt ?? null,
    expireExact: window?.exact ?? false,
    window,
    esimStatus: null,
    qrCodeUrl: order.qrCodeUrl,
    smdpAddress: order.smdpAddress,
    activationCode: order.activationCode,
  };
}

/**
 * What this eSIM can be renewed with, at our price. A top-up that is also sold as a new plan takes
 * that plan's price (including the admin's override), so a renewal never costs more than buying the
 * same package fresh; anything else gets the standard rule.
 */
export async function getRenewalOptions(ctx: RenewalContext): Promise<RenewalOption[]> {
  if (!ctx.renewable || !ctx.iccid || !isPikaSimConfigured()) return [];
  const [topups, plans] = await Promise.all([getPikaTopupOptions(ctx.iccid), getPhonePlans()]);
  return topups
    .map((t) => {
      const costUsd = t.price / 100;
      const same = plans.find((p) => p.code === t.packageCode);
      return {
        id: renewalId(ctx.baseOrderId, t.packageCode),
        code: t.packageCode,
        name: t.name,
        dataGb: t.volumeGB,
        days: t.duration,
        voiceMinutes: t.voiceMinutes ?? same?.voiceMinutes ?? null,
        sms: t.smsCount ?? same?.sms ?? null,
        priceUsd: same ? same.priceUsd : phonePriceUsd(costUsd),
        costUsd,
      };
    })
    .sort((a, b) => a.days - b.days || a.priceUsd - b.priceUsd);
}

export function toPublicRenewalOption(o: RenewalOption): PublicRenewalOption {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { costUsd: _cost, ...rest } = o;
  return rest;
}

/** Does this customer own the eSIM behind a renewal id? Checked before anyone can pay for one. */
export async function customerOwnsRenewal(productId: string, customer: { id: string; email: string }): Promise<boolean> {
  const ref = parseProductId(productId);
  if (ref.kind !== 'renewal') return false;
  const base = await prisma.order.findUnique({ where: { id: ref.orderId }, select: { customerId: true, customerEmail: true } });
  return Boolean(base && (base.customerId === customer.id || base.customerEmail.toLowerCase() === customer.email.toLowerCase()));
}

/** Days until the current plan ends; null when unknown. */
export function daysLeft(expireTime: string | null, now = Date.now()): number | null {
  if (!expireTime) return null;
  const ms = new Date(expireTime).getTime() - now;
  return Number.isFinite(ms) ? Math.ceil(ms / 86400000) : null;
}


/**
 * The customer's confirmation for a renewal order: what was added and the new end date, computed from
 * our own orders — this renewal included even if it is not marked COMPLETED yet.
 */
export async function sendRenewalConfirmation(order: {
  packageCode: string;
  orderNo: string;
  customerEmail: string;
  customerName: string;
  locale: string | null;
  dataAmount: string;
  validity: string;
}): Promise<boolean> {
  const ref = parseProductId(order.packageCode);
  if (ref.kind !== 'renewal') return false;
  const baseOrder = await prisma.order.findUnique({
    where: { id: ref.orderId },
    select: { id: true, validity: true, paidAt: true, createdAt: true },
  });
  const window = baseOrder
    ? await loadPlanWindow(baseOrder, { orderNo: order.orderNo, validity: order.validity }).catch(() => null)
    : null;
  const locale = toEmailLocale(order.locale);
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.sim2me.net';
  return sendRenewalConfirmedEmail(
    order.customerEmail,
    {
      customerName: order.customerName,
      added: [order.dataAmount, order.validity].filter(Boolean).join(' · '),
      validUntil: window ? formatDay(window.endsOn, locale) : null,
      validUntilExact: window?.exact ?? false,
      orderNo: order.orderNo,
      accountLink: `${site}/${locale}/account`,
    },
    locale,
  ).catch(() => false);
}

/** "2026-10-05" in the reader's calendar format, read as a calendar day (no time-zone shift). */
export function formatDay(isoDay: string, locale: string): string {
  return new Date(`${isoDay}T00:00:00Z`).toLocaleDateString(locale === 'he' ? 'he-IL' : locale, { timeZone: 'UTC' });
}
