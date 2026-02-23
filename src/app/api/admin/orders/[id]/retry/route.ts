import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { purchasePackage, getEsimProfile } from '@/lib/esimaccess';
import { sendPostPurchaseEmail } from '@/lib/email';

function baseUrl(): string {
  const u = process.env.NEXT_PUBLIC_SITE_URL;
  return u ? u.replace(/\/$/, '') : 'https://www.sim2me.net';
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (order.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Order already completed' }, { status: 400 });
  }

  try {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'PROCESSING', errorMessage: null } });

    const purchase = await purchasePackage(order.packageCode, 1);
    const orderNo = purchase.orderNo;

    await prisma.order.update({
      where: { id: order.id },
      data: { esimOrderId: orderNo, esimTransactionId: purchase.transactionId },
    });

    const profileResult = await getEsimProfile(orderNo);
    const firstProfile = profileResult?.esimList?.[0];

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        ...(firstProfile && {
          iccid: firstProfile.iccid,
          qrCodeUrl: firstProfile.qrCodeUrl,
          smdpAddress: firstProfile.smdpAddress,
          activationCode: firstProfile.activationCode,
        }),
      },
    });

    if (firstProfile) {
      sendPostPurchaseEmail(order.customerEmail, {
        customerName: order.customerName || 'Customer',
        planName: order.packageName,
        dataGb: order.dataAmount,
        validityDays: order.validity,
        qrCodeUrl: firstProfile.qrCodeUrl || null,
        smdpAddress: firstProfile.smdpAddress,
        activationCode: firstProfile.activationCode,
        loginLink: `${baseUrl()}/account`,
        email: order.customerEmail,
      }).catch((e) => console.error('[Retry] Email failed (non-fatal)', e));
    }

    return NextResponse.json({ success: true, message: 'Order fulfilled successfully' });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FAILED', errorMessage: errMsg.slice(0, 1000) },
    });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
