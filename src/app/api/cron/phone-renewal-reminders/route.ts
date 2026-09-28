/**
 * Ticket 042 — remind customers to renew a US / global number about 48 hours before it ends.
 *
 * Runs every hour and never calls PikaSim: the end of each plan is computed from our own orders
 * (`phone-validity.ts`) — the customer's installation date if they gave one, otherwise the purchase
 * date, which is the earliest the plan can end, so the reminder is never late. One reminder per end
 * date: a renewal or a newly given installation date moves the end, and the new end earns its own.
 * Europe and local numbers cannot be renewed and get no reminder. (Gabriel, 2026-09-28.)
 *
 * Auth: Bearer CRON_SECRET, like the other crons. Fail-closed.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendRenewalReminderEmail, toEmailLocale } from '@/lib/email';
import { isRenewableRegion } from '@/lib/phone-plans';
import { formatDay } from '@/lib/renewal';
import { isReminderDue, loadPlanWindow } from '@/lib/phone-validity';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_PER_RUN = 200;
const REMINDED_PREFIX = 'renewal_reminded:';

/** US numbers are Airalo "Change+", global ones "Discover+" — the two families that can be renewed. */
function isRenewableCode(packageCode: string): boolean {
  const code = packageCode.slice(3);
  if (code.startsWith('change-plus')) return isRenewableRegion('us');
  if (code.startsWith('discover+')) return isRenewableRegion('global');
  return false;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[phone-renewal-reminders] CRON_SECRET not configured — endpoint disabled');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // US and global plans, with renewals, run up to about a year; nothing older can still be live.
  const since = new Date(Date.now() - 400 * 86_400_000);
  const orders = await prisma.order.findMany({
    where: { packageCode: { startsWith: 'pk:' }, status: 'COMPLETED', iccid: { not: null }, createdAt: { gte: since } },
    select: { id: true, packageCode: true, validity: true, paidAt: true, createdAt: true, customerEmail: true, customerName: true, locale: true },
    orderBy: { createdAt: 'desc' },
    take: MAX_PER_RUN,
  });

  const now = new Date();
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.sim2me.net';
  let due = 0;
  let sent = 0;
  for (const order of orders) {
    if (!isRenewableCode(order.packageCode)) continue;
    const window = await loadPlanWindow(order).catch(() => null);
    if (!window || !isReminderDue(window.endsAt, now)) continue;
    due++;

    // Claim first, then send: two overlapping runs must not both email the customer.
    const key = `${REMINDED_PREFIX}${order.id}:${window.endsOn}`;
    try {
      await prisma.siteSetting.create({ data: { key, value: now.toISOString() } });
    } catch {
      continue; // already reminded for this end date
    }
    const locale = toEmailLocale(order.locale);
    const ok = await sendRenewalReminderEmail(
      order.customerEmail,
      {
        customerName: order.customerName,
        endsOn: formatDay(window.endsOn, locale),
        exact: window.exact,
        accountLink: `${base}/${locale}/account`,
      },
      locale,
    ).catch(() => false);
    if (ok) sent++;
    // A failed send releases the claim, so the next hourly run tries again.
    else await prisma.siteSetting.delete({ where: { key } }).catch(() => {});
  }

  return NextResponse.json({ checked: orders.length, due, sent });
}
