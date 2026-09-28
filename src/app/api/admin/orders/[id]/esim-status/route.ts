import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getEsimUsage, getEsimProfile } from '@/lib/esimaccess';
import { isPhoneOrder } from '@/lib/phone-number';
import { getRenewalContext } from '@/lib/renewal';

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

  /* Ticket 042: a PikaSim phone plan. PikaSim reports no status, usage or number for these (their API
     returns nulls), so it is not asked: the admin sees what we know from our own orders — the plan's
     dates (phone-validity.ts), and the eSIM's install details stored at purchase. */
  if (isPhoneOrder(order.packageCode)) {
    const ctx = await getRenewalContext(order.id).catch(() => null);
    return NextResponse.json({
      supplier: 'PikaSim',
      phoneNumber: null,
      plan: ctx?.window ?? null,
      renewable: ctx?.renewable ?? false,
      iccid: order.iccid,
      qrCodeUrl: ctx?.qrCodeUrl ?? null,
      smdpAddress: ctx?.smdpAddress ?? null,
      activationCode: ctx?.activationCode ?? null,
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
