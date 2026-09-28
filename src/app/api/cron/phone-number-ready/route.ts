/**
 * Ticket 042 — send the "your number is ready" email without waiting for anyone to look.
 *
 * The purchase email of a phone plan promises a second email once the number exists, which is only
 * after the traveller installs the eSIM. Until this ran, that email went out only when the customer
 * opened their account page or the admin pressed the status button. Every 15 minutes this asks
 * PikaSim about each phone order whose number has not been announced yet, and announces the ones
 * that now have a real number — through the same `announcePhoneNumberOnce`, so it is still sent once.
 *
 * Recent orders are checked on every run, older ones once an hour (`isDueForNumberCheck`).
 *
 * Auth: Bearer CRON_SECRET, like the other crons. Fail-closed.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  announcePhoneNumberOnce,
  isDueForNumberCheck,
  numberNotifiedKey,
  NOTIFIED_PREFIX,
  NUMBER_CHECK_MAX_AGE_DAYS,
  readPhoneOrder,
} from '@/lib/phone-number';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** PikaSim calls per run at most, a few at a time, and stop well inside the 60 s limit. PikaSim allows
    60 requests a minute for the whole site (see pikasim-limiter.ts), so one run takes a small share. */
const MAX_PER_RUN = 10;
const CONCURRENCY = 5;
const TIME_BUDGET_MS = 45_000;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[phone-number-ready] CRON_SECRET not configured — endpoint disabled');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  const now = new Date();
  const since = new Date(now.getTime() - NUMBER_CHECK_MAX_AGE_DAYS * 86400000);

  // Renewals (`rn:`) keep a number that was already announced, so only first purchases are checked.
  const [orders, notified] = await Promise.all([
    prisma.order.findMany({
      where: { packageCode: { startsWith: 'pk:' }, status: 'COMPLETED', iccid: { not: null }, createdAt: { gte: since } },
      select: {
        id: true, orderNo: true, iccid: true, packageCode: true, createdAt: true,
        customerEmail: true, customerName: true, packageName: true, locale: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.siteSetting.findMany({ where: { key: { startsWith: NOTIFIED_PREFIX } }, select: { key: true } }),
  ]);
  const alreadyAnnounced = new Set(notified.map((s: { key: string }) => s.key));

  const due = orders
    .filter((o: (typeof orders)[number]) => !alreadyAnnounced.has(numberNotifiedKey(o)) && isDueForNumberCheck(o.createdAt, now))
    .slice(0, MAX_PER_RUN);

  let checked = 0;
  let announced = 0;
  for (let i = 0; i < due.length; i += CONCURRENCY) {
    if (Date.now() - started > TIME_BUDGET_MS) break;
    await Promise.all(
      due.slice(i, i + CONCURRENCY).map(async (order: (typeof due)[number]) => {
        checked++;
        const { phoneNumber } = await readPhoneOrder(order.iccid);
        if (!phoneNumber) return;
        await announcePhoneNumberOnce(order, phoneNumber);
        announced++;
      }),
    );
  }

  return NextResponse.json({ due: due.length, checked, announced });
}
