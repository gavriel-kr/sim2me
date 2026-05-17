import { NextResponse } from 'next/server';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getEsimUsage } from '@/lib/esimaccess';

export const dynamic = 'force-dynamic';

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

  // Verify the order belongs to this customer
  const customer = await prisma.customer.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [{ customerId: customer.id }, { customerEmail: customer.email }],
    },
    select: { id: true, iccid: true },
  });

  if (!order || order.iccid !== iccid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let profile = null;
  let fetchError: string | null = null;
  try {
    profile = await getEsimUsage(iccid);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e);
    console.error('[usage] getEsimUsage threw:', fetchError);
  }

  if (!profile) {
    console.warn('[usage] no profile for iccid:', iccid, 'error:', fetchError);
    return NextResponse.json({ usage: null, debug: { iccid, fetchError } });
  }

  return NextResponse.json({
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
