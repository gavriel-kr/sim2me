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
import { readPhoneOrder } from '@/lib/phone-number';
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
  phoneNumber: string | null;
  /** ISO time the current plan ends, as PikaSim reports it. */
  expireTime: string | null;
  esimStatus: string | null;
  /** Kept from the base order so a renewal record can show the same install details. */
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
}

/** Resolve any order of a phone eSIM — the original sale or one of its renewals — to its base order. */
export async function getRenewalContext(orderId: string, opts: { live?: boolean } = {}): Promise<RenewalContext | null> {
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
  const plans = await getPhonePlans();
  const plan = plans.find((p) => p.code === code);
  // A plan no longer in the catalogue still has a region we can read from its code's family.
  const region: PhoneRegion | null = plan?.region ?? (code.startsWith('change-plus') ? 'us' : code.startsWith('discover+') ? 'global' : null);
  const live = opts.live === false ? { esim: null, phoneNumber: null } : await readPhoneOrder(order.iccid);

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
    phoneNumber: live.phoneNumber,
    expireTime: live.esim?.expireTime ?? null,
    esimStatus: live.esim?.status ?? null,
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
 * The customer's confirmation for a renewal order: the number they kept, what was added, and the new
 * end date as PikaSim reports it right after the top-up.
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
  const ctx = await getRenewalContext(ref.orderId).catch(() => null);
  const locale = toEmailLocale(order.locale);
  const validUntil = ctx?.expireTime ? new Date(ctx.expireTime).toLocaleDateString(locale === 'he' ? 'he-IL' : locale) : null;
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.sim2me.net';
  return sendRenewalConfirmedEmail(
    order.customerEmail,
    {
      customerName: order.customerName,
      phoneNumber: ctx?.phoneNumber ?? null,
      added: [order.dataAmount, order.validity].filter(Boolean).join(' · '),
      validUntil,
      orderNo: order.orderNo,
      accountLink: `${base}/${locale}/account`,
    },
    locale,
  ).catch(() => false);
}
