import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getEsimUsage, getEsimProfile } from '@/lib/esimaccess';
import { announcePhoneNumberOnce, isPhoneOrder, readPhoneOrder } from '@/lib/phone-number';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true, iccid: true, esimOrderId: true, packageCode: true,
      orderNo: true, customerEmail: true, customerName: true, packageName: true, locale: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (!order.iccid && !order.esimOrderId) {
    return NextResponse.json({ noEsim: true });
  }

  // Ticket 042: a PikaSim phone plan is read from PikaSim, and shows the phone number once it exists.
  if (isPhoneOrder(order.packageCode)) {
    const { esim, phoneNumber } = await readPhoneOrder(order.iccid);
    if (!esim) return NextResponse.json({ noEsim: !order.iccid, error: order.iccid ? 'PikaSim did not return this eSIM' : undefined });
    if (phoneNumber) await announcePhoneNumberOnce(order, phoneNumber);
    return NextResponse.json({
      supplier: 'PikaSim',
      phoneNumber,
      status: esim.status ?? null,
      smdpStatus: esim.smdpStatus ?? null,
      esimStatus: esim.status ?? null,
      usedVolume: esim.usedData ?? null,
      remainingVolume: esim.remainingData ?? null,
      orderVolume: esim.totalData ?? null,
      expiredTime: esim.expireTime ?? null,
      activateTime: null,
      totalDuration: null,
      durationUnit: null,
      iccid: esim.iccid ?? null,
      qrCodeUrl: esim.qrCodeUrl ?? null,
      smdpAddress: null,
      activationCode: esim.activationCode ?? null,
    });
  }

  try {
    let profile = null;

    if (order.iccid) {
      profile = await getEsimUsage(order.iccid);
    }

    if (!profile && order.esimOrderId) {
      const result = await getEsimProfile(order.esimOrderId);
      profile = result?.esimList?.[0] ?? null;
    }

    if (!profile) {
      return NextResponse.json({ noEsim: true });
    }

    return NextResponse.json({
      status: profile.esimStatus ?? profile.status ?? null,
      smdpStatus: profile.smdpStatus ?? null,
      esimStatus: profile.esimStatus ?? null,
      usedVolume: profile.usedVolume ?? null,
      remainingVolume: profile.remainingVolume ?? null,
      orderVolume: profile.orderVolume ?? null,
      expiredTime: profile.expiredTime ?? null,
      activateTime: profile.activateTime ?? null,
      totalDuration: profile.totalDuration ?? null,
      durationUnit: profile.durationUnit ?? null,
      iccid: profile.iccid ?? null,
      qrCodeUrl: profile.qrCodeUrl ?? null,
      smdpAddress: profile.smdpAddress ?? null,
      activationCode: profile.activationCode ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[esim-status] Error:', msg);
    return NextResponse.json({ error: msg });
  }
}
