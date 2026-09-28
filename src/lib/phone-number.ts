/**
 * Ticket 042 — the phone number of a PikaSim order, read live and announced once.
 *
 * There is no column for it: the number only exists after the traveller installs the eSIM, PikaSim
 * always has the current value, and the schema stays untouched. Whoever looks first — the scheduled
 * check (`/api/cron/phone-number-ready`, every 15 minutes), the customer's account page or the admin's
 * status button — triggers the one "your number is ready" email. A `SiteSetting` row per eSIM records
 * that it went out, so it is never sent twice.
 */

import { prisma } from '@/lib/prisma';
import { confirmedMsisdn, getPikaEsim, isPikaSimConfigured, type PikaEsim } from '@/lib/pikasim';
import { sendPhoneNumberReadyEmail, toEmailLocale } from '@/lib/email';
import { getPhonePlans } from '@/lib/phone-catalog';
import { isRenewableRegion } from '@/lib/phone-plans';

export const NOTIFIED_PREFIX = 'phone_number_notified:';

/** A PikaSim phone plan, or a renewal of one (same eSIM, same number). */
export function isPhoneOrder(packageCode: string | null | undefined): boolean {
  return Boolean(packageCode?.startsWith('pk:') || packageCode?.startsWith('rn:'));
}

function baseUrl(): string {
  const u = process.env.NEXT_PUBLIC_SITE_URL;
  return u ? u.replace(/\/$/, '') : 'https://www.sim2me.net';
}

export interface PhoneOrderState {
  esim: PikaEsim | null;
  /** Null until the eSIM is installed and the network has assigned a real number. */
  phoneNumber: string | null;
}

/** Live eSIM state for a phone order. Never throws: a PikaSim hiccup reads as "not known yet". */
export async function readPhoneOrder(iccid: string | null | undefined): Promise<PhoneOrderState> {
  if (!iccid || !isPikaSimConfigured()) return { esim: null, phoneNumber: null };
  try {
    const esim = await getPikaEsim(iccid);
    return { esim, phoneNumber: confirmedMsisdn(esim) };
  } catch {
    return { esim: null, phoneNumber: null };
  }
}

/** How far back the scheduled check looks: a plan bought for a trip months away is still waiting. */
export const NUMBER_CHECK_MAX_AGE_DAYS = 180;
/** Orders younger than this are checked on every run (every 15 minutes); older ones once an hour. */
export const NUMBER_CHECK_EVERY_RUN_DAYS = 14;

/**
 * Whether the scheduled check should ask PikaSim about this order on this run. Most customers install
 * within days of buying, so those are checked every run; an order that has waited two weeks is checked
 * on the first run of each hour, so customers who never install do not cost 96 calls a day each.
 */
export function isDueForNumberCheck(createdAt: Date, now: Date): boolean {
  const ageDays = (now.getTime() - createdAt.getTime()) / 86400000;
  if (ageDays < 0 || ageDays > NUMBER_CHECK_MAX_AGE_DAYS) return false;
  if (ageDays <= NUMBER_CHECK_EVERY_RUN_DAYS) return true;
  return now.getUTCMinutes() < 15;
}

/** The `SiteSetting` key that records the number email went out, so callers can skip announced eSIMs. */
export function numberNotifiedKey(order: { id: string; iccid?: string | null }): string {
  return `${NOTIFIED_PREFIX}${order.iccid || order.id}`;
}

/** Send the "your number is ready" email the first time a number is seen for this order. */
export async function announcePhoneNumberOnce(
  order: { id: string; orderNo: string; customerEmail: string; customerName: string; packageName: string; locale: string | null; iccid?: string | null; packageCode?: string },
  phoneNumber: string,
): Promise<void> {
  // Keyed by the eSIM, not the order: a renewal is a new order on the same number and must not
  // announce a number the customer already has.
  const key = numberNotifiedKey(order);
  const already = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (already) return;
  // Claim first, then send: two tabs polling at once must not both email the customer.
  try {
    await prisma.siteSetting.create({ data: { key, value: phoneNumber } });
  } catch {
    return; // someone else claimed it
  }
  const locale = toEmailLocale(order.locale);
  // Only a US or global number can be renewed; the email must not promise it for the others.
  const code = order.packageCode?.startsWith('pk:') ? order.packageCode.slice(3) : null;
  const plan = code ? (await getPhonePlans().catch(() => [])).find((p) => p.code === code) : null;
  const renewable = plan ? isRenewableRegion(plan.region) : Boolean(code?.startsWith('change-plus') || code?.startsWith('discover+'));
  await sendPhoneNumberReadyEmail(
    order.customerEmail,
    {
      customerName: order.customerName,
      phoneNumber,
      planName: order.packageName,
      orderNo: order.orderNo,
      accountLink: `${baseUrl()}/${locale}/account`,
      renewable,
    },
    locale,
  ).catch((e) => console.warn('[phone-number] ready email failed', order.id, e));
}
