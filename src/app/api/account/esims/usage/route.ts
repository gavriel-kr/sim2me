import { NextResponse } from 'next/server';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getEsimProfile, getEsimUsage } from '@/lib/esimaccess';
import { isPhoneOrder } from '@/lib/phone-number';
import { getRenewalContext } from '@/lib/renewal';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/*
  Guard added 2026-09-28. The account page used to call this in an endless loop (about five times a
  second per eSIM), and every call went straight to the supplier: PikaSim suspended our account and
  eSIMaccess started answering "system busy". The page is fixed, but a browser still running the old
  page, or any future bug, must not reach the suppliers again:
   - the same customer asking about the same eSIM within a minute gets the last answer from memory;
   - across all instances, one eSIM is looked up at the supplier at most a few times a minute.
*/
const ANSWER_CACHE_MS = 60_000;
const SUPPLIER_LOOKUPS_PER_ESIM_PER_MINUTE = 4;
const answers = new Map<string, { at: number; body: unknown }>();

function remember(key: string, body: unknown) {
  if (answers.size >= 1000) {
    const now = Date.now();
    for (const [k, v] of answers) if (now - v.at >= ANSWER_CACHE_MS) answers.delete(k);
    if (answers.size >= 1000) answers.clear();
  }
  answers.set(key, { at: Date.now(), body });
}

function answer(key: string, body: unknown) {
  remember(key, body);
  return NextResponse.json(body);
}

export async function GET(request: Request) {
  const session = await getSessionForRequest(request);
  if (!isCustomerSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const iccid = searchParams.get('iccid');
  const orderId = searchParams.get('orderId');

  if (!iccid || !orderId) {
    return NextResponse.json({ error: 'iccid and orderId required' }, { status: 400 });
  }

  // Only after the session check: an answer is kept per customer, order and eSIM.
  const cacheKey = `${userId}:${orderId}:${iccid}`;
  const cached = answers.get(cacheKey);
  if (cached && Date.now() - cached.at < ANSWER_CACHE_MS) return NextResponse.json(cached.body);

  // Verify the order belongs to this customer
  const customer = await prisma.customer.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [{ customerId: customer.id }, { customerEmail: customer.email }],
    },
    select: {
      id: true, iccid: true, esimOrderId: true, packageCode: true,
      orderNo: true, customerEmail: true, customerName: true, packageName: true, locale: true,
    },
  });

  if (!order || order.iccid !== iccid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  /* Ticket 042. A PikaSim phone plan: PikaSim reports no status, usage or number for these, so they
     are not asked. The plan's dates come from our own orders (phone-validity.ts). Not cached: it is a
     database read, and the customer may have just given their installation date. */
  if (isPhoneOrder(order.packageCode)) {
    const ctx = await getRenewalContext(order.id).catch(() => null);
    return NextResponse.json({
      usage: null,
      phonePlan: true,
      phoneNumber: null,
      // Only US and global numbers can be renewed and kept (ticket 042).
      renewable: ctx?.renewable ?? false,
      plan: ctx?.window
        ? {
            baseOrderId: ctx.baseOrderId,
            // The installation date belongs to the original sale; a renewal's card shows it, read-only.
            canSetInstallDate: order.packageCode.startsWith('pk:'),
            ...ctx.window,
          }
        : null,
    });
  }

  if (!(await checkRateLimit(`esim:${iccid}`, 'account-usage', SUPPLIER_LOOKUPS_PER_ESIM_PER_MINUTE, 60))) {
    return NextResponse.json(cached?.body ?? { usage: null, throttled: true });
  }

  // Prefer esimOrderId query (proven reliable); fall back to iccid query
  let profile = null;
  if (order.esimOrderId) {
    try {
      const result = await getEsimProfile(order.esimOrderId);
      profile = result?.esimList?.[0] ?? null;
    } catch {
      profile = null;
    }
  }
  if (!profile && iccid) {
    profile = await getEsimUsage(iccid);
  }

  if (!profile) {
    return answer(cacheKey, { usage: null });
  }

  return answer(cacheKey, {
    usage: {
      esimStatus: profile.esimStatus ?? profile.status ?? null,
      smdpStatus: profile.smdpStatus ?? null,
      orderVolume: profile.orderVolume ?? null,
      usedVolume: profile.usedVolume ?? null,
      remainingVolume: profile.remainingVolume ?? null,
      expiredTime: profile.expiredTime ?? null,
      activateTime: profile.activateTime ?? null,
      totalDuration: profile.totalDuration ?? null,
      durationUnit: profile.durationUnit ?? null,
    },
  });
}
