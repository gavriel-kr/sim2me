/**
 * Ticket 042 (2026-09-28) — when a phone plan ends, worked out from our own orders.
 *
 * PikaSim returns nothing live for phone-plan eSIMs: `GET /esims/:iccid` comes back with status, usage,
 * end date and number all null, and `/esims/:iccid/usage` answers 404. So nothing here asks them.
 * What we know for certain is when the customer bought the plan, how many days it runs, and every
 * renewal bought since (each renewal is an order of its own, `rn:<baseOrderId>:<topup>`).
 *
 * A plan starts counting when the eSIM is installed, which only the customer knows. They can tell us
 * in their account (Gabriel's decision); until they do, the end is counted from the purchase — the
 * earliest it can be — so the renewal reminder is never late, only sometimes early.
 *
 * The installation date is kept in `SiteSetting` (`phone_installed:<baseOrderId>` = YYYY-MM-DD), so no
 * schema change is needed.
 */

import { prisma } from '@/lib/prisma';

export const INSTALLED_PREFIX = 'phone_installed:';
/** The one renewal reminder goes out this long before the end (Gabriel, 2026-09-28). */
export const REMINDER_HOURS_BEFORE = 48;

const DAY_MS = 86_400_000;

/** "7 days" → 7. Our own orders always write `validity` as `${days} days`. */
export function daysFromValidity(validity: string | null | undefined): number | null {
  const m = /^\s*(\d+)\s*days?\b/i.exec(validity ?? '');
  const n = m ? Number(m[1]) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}

function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(isoDay: string, days: number): string {
  return utcDay(new Date(Date.parse(`${isoDay}T00:00:00Z`) + days * DAY_MS));
}

/**
 * A date the customer may give as their installation day: a real calendar day, not before the
 * purchase and not in the future. One day of slack either side covers the gap between UTC and the
 * customer's own calendar.
 */
export function isValidInstallDate(value: string, purchasedAt: Date, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(ms) || utcDay(new Date(ms)) !== value) return false;
  const earliest = Date.parse(`${utcDay(purchasedAt)}T00:00:00Z`) - DAY_MS;
  const latest = Date.parse(`${utcDay(now)}T00:00:00Z`) + DAY_MS;
  return ms >= earliest && ms <= latest;
}

export interface PlanWindow {
  /** ISO time of the purchase. */
  purchasedAt: string;
  planDays: number;
  /** Days added by renewals bought since. */
  renewalDays: number;
  /** YYYY-MM-DD the customer said they installed the eSIM, or null. */
  installedOn: string | null;
  /** YYYY-MM-DD the plan ends. */
  endsOn: string;
  /** The moment the reminder counts back from (start of `endsOn`, or purchase + days). */
  endsAt: string;
  /** True when counted from the customer's installation date; false when counted from the purchase. */
  exact: boolean;
}

export function computePlanWindow(input: {
  purchasedAt: Date;
  planDays: number;
  renewalDays: number;
  installedOn: string | null;
}): PlanWindow {
  const total = input.planDays + input.renewalDays;
  if (input.installedOn) {
    const endsOn = addDays(input.installedOn, total);
    return {
      purchasedAt: input.purchasedAt.toISOString(),
      planDays: input.planDays,
      renewalDays: input.renewalDays,
      installedOn: input.installedOn,
      endsOn,
      endsAt: `${endsOn}T00:00:00.000Z`,
      exact: true,
    };
  }
  const endsAt = new Date(input.purchasedAt.getTime() + total * DAY_MS);
  return {
    purchasedAt: input.purchasedAt.toISOString(),
    planDays: input.planDays,
    renewalDays: input.renewalDays,
    installedOn: null,
    endsOn: utcDay(endsAt),
    endsAt: endsAt.toISOString(),
    exact: false,
  };
}

/** Whether the 48-hour reminder is due now for a plan ending at `endsAt`. */
export function isReminderDue(endsAt: string, now = new Date()): boolean {
  const end = Date.parse(endsAt);
  return now.getTime() >= end - REMINDER_HOURS_BEFORE * 3_600_000 && now.getTime() < end;
}

export async function getInstalledOn(baseOrderId: string): Promise<string | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: `${INSTALLED_PREFIX}${baseOrderId}` } });
  return row?.value && /^\d{4}-\d{2}-\d{2}$/.test(row.value) ? row.value : null;
}

export async function setInstalledOn(baseOrderId: string, day: string): Promise<void> {
  const key = `${INSTALLED_PREFIX}${baseOrderId}`;
  await prisma.siteSetting.upsert({ where: { key }, create: { key, value: day }, update: { value: day } });
}

/**
 * The window of a phone plan from the database only. `pendingRenewal` counts a renewal that is being
 * confirmed right now and may not be marked COMPLETED yet.
 */
export async function loadPlanWindow(
  base: { id: string; validity: string; paidAt: Date | null; createdAt: Date },
  pendingRenewal?: { orderNo: string; validity: string } | null,
): Promise<PlanWindow | null> {
  const planDays = daysFromValidity(base.validity);
  if (!planDays) return null;
  const [renewals, installedOn] = await Promise.all([
    prisma.order.findMany({
      where: { packageCode: { startsWith: `rn:${base.id}:` }, status: 'COMPLETED' },
      select: { orderNo: true, validity: true },
    }),
    getInstalledOn(base.id),
  ]);
  let renewalDays = renewals.reduce((sum: number, r: { validity: string }) => sum + (daysFromValidity(r.validity) ?? 0), 0);
  if (pendingRenewal && !renewals.some((r: { orderNo: string }) => r.orderNo === pendingRenewal.orderNo)) {
    renewalDays += daysFromValidity(pendingRenewal.validity) ?? 0;
  }
  return computePlanWindow({ purchasedAt: base.paidAt ?? base.createdAt, planDays, renewalDays, installedOn });
}
