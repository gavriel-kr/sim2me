/**
 * Ticket 042 — remind customers to renew a US / global number before it is gone.
 *
 * Once a day: every completed PikaSim phone order whose eSIM ends within the next 7 days, whose number
 * is known (installed), and which can be renewed, gets one reminder per end date. A renewal moves the
 * end date, so the next period earns its own reminder; the same period never gets two.
 *
 * Auth: Bearer CRON_SECRET, like the other crons. Fail-closed.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendRenewalReminderEmail, toEmailLocale } from '@/lib/email';
import { daysLeft, getRenewalContext } from '@/lib/renewal';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REMIND_WITHIN_DAYS = 7;
const MAX_PER_RUN = 150;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[phone-renewal-reminders] CRON_SECRET not configured — endpoint disabled');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // US and global plans run up to a year; nothing older can still be live.
  const since = new Date(Date.now() - 400 * 86400000);
  const orders = await prisma.order.findMany({
    where: { packageCode: { startsWith: 'pk:' }, status: 'COMPLETED', iccid: { not: null }, createdAt: { gte: since } },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: MAX_PER_RUN,
  });

  let reminded = 0;
  let checked = 0;
  for (const { id } of orders) {
    checked++;
    const ctx = await getRenewalContext(id).catch(() => null);
    if (!ctx?.renewable || !ctx.phoneNumber || !ctx.expireTime || !ctx.iccid) continue;
    const left = daysLeft(ctx.expireTime);
    if (left == null || left < 0 || left > REMIND_WITHIN_DAYS) continue;

    const key = `renewal_reminded:${ctx.iccid}:${ctx.expireTime.slice(0, 10)}`;
    try {
      await prisma.siteSetting.create({ data: { key, value: new Date().toISOString() } });
    } catch {
      continue; // already reminded for this end date
    }
    const locale = toEmailLocale(ctx.locale);
    const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.sim2me.net';
    const sent = await sendRenewalReminderEmail(
      ctx.customerEmail,
      { customerName: ctx.customerName, phoneNumber: ctx.phoneNumber, daysLeft: left, accountLink: `${base}/${locale}/account` },
      locale,
    ).catch(() => false);
    if (sent) reminded++;
  }

  return NextResponse.json({ checked, reminded });
}
