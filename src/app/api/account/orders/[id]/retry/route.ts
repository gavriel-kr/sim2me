export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { purchasePackage, getEsimProfileWithRetry } from '@/lib/esimaccess';
import { sendPostPurchaseEmail } from '@/lib/email';

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net').replace(/\/$/, '');
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const type = (session?.user as { type?: string })?.type;
  const userId = (session?.user as { id?: string })?.id;

  if (type !== 'customer' || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only allow retrying orders that belong to this customer
  const order = await prisma.order.findFirst({
    where: {
      id: params.id,
      status: 'FAILED',
      OR: [{ customerId: customer.id }, { customerEmail: customer.email }],
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found or cannot be retried' }, { status: 404 });
  }

  try {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'PROCESSING', errorMessage: null } });

    const purchase = await purchasePackage(order.packageCode, 1);
    const orderNo = purchase.orderNo;

    await prisma.order.update({
      where: { id: order.id },
      data: { esimOrderId: orderNo, esimTransactionId: purchase.transactionId },
    });

    const profileResult = await getEsimProfileWithRetry(orderNo, 5, 5000);
    const firstProfile = profileResult?.esimList?.[0];

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        customerId: customer.id,
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
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FAILED', errorMessage: errMsg.slice(0, 1000) },
    });
    return NextResponse.json({ error: 'Retry failed. Please contact support.' }, { status: 500 });
  }
}
