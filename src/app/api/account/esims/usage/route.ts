import { NextResponse } from 'next/server';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getEsimProfile, getEsimUsage } from '@/lib/esimaccess';
import { announcePhoneNumberOnce, isPhoneOrder, readPhoneOrder } from '@/lib/phone-number';
import { getRenewalContext } from '@/lib/renewal';

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
    select: {
      id: true, iccid: true, esimOrderId: true, packageCode: true,
      orderNo: true, customerEmail: true, customerName: true, packageName: true, locale: true,
    },
  });

  if (!order || order.iccid !== iccid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  /* Ticket 042. A PikaSim phone plan: usage and the phone number come from PikaSim. The first time a
     real number shows up, the customer also gets it by email. */
  if (isPhoneOrder(order.packageCode)) {
    const { esim, phoneNumber } = await readPhoneOrder(iccid);
    if (phoneNumber) await announcePhoneNumberOnce(order, phoneNumber);
    return NextResponse.json({
      usage: esim
        ? {
            esimStatus: esim.status ?? null,
            smdpStatus: esim.smdpStatus ?? null,
            orderVolume: esim.totalData ?? null,
            usedVolume: esim.usedData ?? null,
            remainingVolume: esim.remainingData ?? null,
            expiredTime: esim.expireTime ?? null,
            activateTime: null,
            totalDuration: null,
            durationUnit: null,
          }
        : null,
      phonePlan: true,
      phoneNumber,
      // Only US and global numbers can be renewed and kept (ticket 042).
      renewable: (await getRenewalContext(order.id, { live: false }).catch(() => null))?.renewable ?? false,
    });
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
    return NextResponse.json({ usage: null });
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
