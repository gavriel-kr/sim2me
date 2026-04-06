import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getEsimUsage, getEsimProfile } from '@/lib/esimaccess';

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
    select: { iccid: true, esimOrderId: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (!order.iccid && !order.esimOrderId) {
    return NextResponse.json({ noEsim: true });
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
      status: profile.status ?? null,
      usedVolume: profile.usedVolume ?? null,
      remainingVolume: profile.remainingVolume ?? null,
      orderVolume: profile.orderVolume ?? null,
      expiredTime: profile.expiredTime ?? null,
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
