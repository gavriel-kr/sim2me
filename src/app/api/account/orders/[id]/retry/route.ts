export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { purchasePackage, getEsimProfileWithRetry } from '@/lib/esimaccess';
import { sendPostPurchaseEmail, sendRetrySucceededEmail, sendRetryFailedEmail, toEmailLocale } from '@/lib/email';
import { checkAndAutoBlockEmail } from '@/lib/fraud';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net').replace(/\/$/, '');
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, 'order-retry', 3, 3600);
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });

  const session = await getSessionForRequest(request);
  if (!isCustomerSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const customer = await prisma.customer.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  /* Only this customer's own order, and never a COMPLETED one. Ticket 037 widened the accepted status
     to include `PROCESSING`, because an order whose supplier purchase succeeded and whose profile did
     not arrive now stays `PROCESSING` instead of turning into a lie — and that is precisely the order a
     customer needs to be able to check again. */
  const order = await prisma.order.findFirst({
    where: {
      id,
      status: { in: ['FAILED', 'PROCESSING'] },
      OR: [{ customerId: customer.id }, { customerEmail: customer.email }],
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found or cannot be retried' }, { status: 404 });
  }

  /* A `PROCESSING` order with no supplier order behind it is mid-flight, not stuck. Buying against it
     would be the double purchase this guard exists to prevent. */
  if (order.status === 'PROCESSING' && !order.esimOrderId) {
    return NextResponse.json({ error: 'This order is still being processed. Please try again shortly.' }, { status: 409 });
  }

  try {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'PROCESSING', errorMessage: null } });

    /* The guard. If the supplier already sold us this eSIM, the only thing missing is the profile, so
       we fetch it. Calling `purchasePackage` again here paid the supplier twice for one sale. */
    let orderNo = order.esimOrderId;
    if (!orderNo) {
      const purchase = await purchasePackage(order.packageCode, 1);
      orderNo = purchase.orderNo;
      await prisma.order.update({
        where: { id: order.id },
        data: { esimOrderId: orderNo, esimTransactionId: purchase.transactionId },
      });
    } else {
      console.log('[Order retry] Supplier order already exists, fetching profile only', {
        orderId: order.id, esimOrderId: orderNo,
      });
    }

    const profileResult = await getEsimProfileWithRetry(orderNo, 5, 5000);
    const firstProfile = profileResult?.esimList?.[0];

    /* No profile yet means still pending, not complete — same rule as the webhook. */
    await prisma.order.update({
      where: { id: order.id },
      data: firstProfile
        ? {
            status: 'COMPLETED',
            customerId: customer.id,
            iccid: firstProfile.iccid,
            qrCodeUrl: firstProfile.qrCodeUrl,
            smdpAddress: firstProfile.smdpAddress,
            activationCode: firstProfile.activationCode,
          }
        : { status: 'PROCESSING', customerId: customer.id },
    });

    /* Still no profile: the order stays pending and no success mail goes out. The customer sees the
       same "being prepared" state, and nothing was bought a second time. */
    if (!firstProfile) {
      return NextResponse.json({ success: false, pending: true }, { status: 202 });
    }

    {
      const emailLocale = toEmailLocale(order.locale);
      sendPostPurchaseEmail(order.customerEmail, {
        customerName: order.customerName || 'Customer',
        planName: order.packageName,
        dataGb: order.dataAmount,
        validityDays: order.validity,
        qrCodeUrl: firstProfile.qrCodeUrl || null,
        smdpAddress: firstProfile.smdpAddress,
        activationCode: firstProfile.activationCode,
        loginLink: `${baseUrl()}/${emailLocale}/account`,
        email: order.customerEmail,
        orderNo: order.orderNo,
        amountPaid: Number(order.totalAmount),
        currency: order.currency,
        orderDate: order.paidAt ?? order.createdAt,
        iccid: firstProfile.iccid ?? null,
      }, emailLocale).catch(() => {});
    }

    sendRetrySucceededEmail({
      orderNo: order.orderNo,
      customerName: order.customerName || order.customerEmail,
      customerEmail: order.customerEmail,
      packageName: order.packageName,
      destination: order.destination,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      iccid: firstProfile.iccid ?? null,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FAILED', errorMessage: errMsg.slice(0, 1000) },
    });
    sendRetryFailedEmail({
      orderNo: order.orderNo,
      customerName: order.customerName || order.customerEmail,
      customerEmail: order.customerEmail,
      packageName: order.packageName,
      destination: order.destination,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      errorMessage: errMsg.slice(0, 300),
    });
    checkAndAutoBlockEmail(order.customerEmail).catch(() => {});
    return NextResponse.json({ error: 'Retry failed. Please contact support.' }, { status: 500 });
  }
}
