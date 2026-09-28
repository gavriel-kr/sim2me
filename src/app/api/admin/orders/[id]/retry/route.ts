export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { describeProduct, placeSupplierOrder, awaitProfile } from '@/lib/fulfillment';
import { sendRenewalConfirmation } from '@/lib/renewal';
import { sendPostPurchaseEmail, sendRetrySucceededEmail, sendRetryFailedEmail, toEmailLocale } from '@/lib/email';
import { checkAndAutoBlockEmail } from '@/lib/fraud';
import { hash } from 'bcryptjs';

function baseUrl(): string {
  const u = process.env.NEXT_PUBLIC_SITE_URL;
  return u ? u.replace(/\/$/, '') : 'https://www.sim2me.net';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (order.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Order already completed' }, { status: 400 });
  }

  try {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'PROCESSING', errorMessage: null } });

    // Refresh supplierCost at retry time (price may have changed; also ensures cost is tracked)
    let retryCost: number | undefined;
    try {
      // Ticket 042: priced by the product's own supplier (eSIMaccess, day pass or PikaSim).
      retryCost = (await describeProduct(order.packageCode))?.supplierCostUsd;
    } catch {
      // Non-fatal: proceed without refreshing cost
    }

    /* Ticket 037. If the supplier already sold us this eSIM, the profile is the only thing missing —
       purchasing again paid twice for one sale. Same guard as the customer-facing retry route. */
    let orderNo = order.esimOrderId;
    if (!orderNo) {
      const purchase = await placeSupplierOrder(order.packageCode, order.id);
      orderNo = purchase.supplierOrderNo;
      await prisma.order.update({
        where: { id: order.id },
        data: {
          esimOrderId: orderNo,
          esimTransactionId: purchase.supplierTxnId,
          ...(retryCost != null && { supplierCost: retryCost }),
        },
      });
    } else {
      console.log('[Admin retry] Supplier order already exists, fetching profile only', {
        orderId: order.id, esimOrderId: orderNo,
      });
      if (retryCost != null) {
        await prisma.order.update({ where: { id: order.id }, data: { supplierCost: retryCost } });
      }
    }

    const firstProfile = await awaitProfile(order.packageCode, orderNo);

    /* No profile means fulfilment is still in flight, so the order stays `PROCESSING`. */
    await prisma.order.update({
      where: { id: order.id },
      data: firstProfile
        ? {
            status: 'COMPLETED',
            iccid: firstProfile.iccid,
            qrCodeUrl: firstProfile.qrCodeUrl,
            smdpAddress: firstProfile.smdpAddress,
            activationCode: firstProfile.activationCode,
          }
        : { status: 'PROCESSING' },
    });

    // Auto-create or link customer account
    let tempPassword: string | null = null;
    try {
      let customer = await prisma.customer.findUnique({ where: { email: order.customerEmail } });
      if (!customer) {
        tempPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
        const hashed = await hash(tempPassword, 10);
        const nameParts = (order.customerName || '').trim().split(' ');
        customer = await prisma.customer.create({
          data: {
            email: order.customerEmail,
            name: nameParts[0] || order.customerName || '',
            lastName: nameParts.slice(1).join(' ') || null,
            password: hashed,
          },
        });
      }
      await prisma.order.update({ where: { id: order.id }, data: { customerId: customer.id } });
    } catch (e) {
      console.warn('[Retry] Customer upsert failed (non-fatal)', e);
    }

    /* Ticket 039: awaited rather than detached, and the outcome is reported back so the agent who
       pressed Retry sees whether the customer was actually told. */
    let customerEmailSent = true;
    if (firstProfile) {
      // The buyer's own language, stored on the order at checkout. Orders placed before that column
      // existed read null, which `toEmailLocale` maps to Hebrew — exactly what they got before.
      const emailLocale = toEmailLocale(order.locale);
      // Ticket 042: a renewal confirms the kept number instead of resending install details.
      customerEmailSent = order.packageCode.startsWith('rn:')
        ? await sendRenewalConfirmation({
            packageCode: order.packageCode, orderNo: order.orderNo, customerEmail: order.customerEmail,
            customerName: order.customerName, locale: order.locale, dataAmount: order.dataAmount, validity: order.validity,
          })
        : await sendPostPurchaseEmail(order.customerEmail, {
        customerName: order.customerName || 'Customer',
        planName: order.packageName,
        phoneNumberPending: order.packageCode.startsWith('pk:'),
        dataGb: order.dataAmount,
        validityDays: order.validity,
        qrCodeUrl: firstProfile.qrCodeUrl || null,
        smdpAddress: firstProfile.smdpAddress,
        activationCode: firstProfile.activationCode,
        loginLink: `${baseUrl()}/${emailLocale}/account`,
        email: order.customerEmail,
        tempPassword,
        orderNo: order.orderNo,
        amountPaid: Number(order.totalAmount),
        currency: order.currency,
        orderDate: order.paidAt ?? order.createdAt,
        iccid: firstProfile.iccid ?? null,
      }, emailLocale).catch((e) => {
        console.error('[Retry] Email failed (non-fatal)', e);
        return false;
      });
      if (!customerEmailSent) {
        console.error('[Retry] Post-purchase email was not accepted', { orderNo: order.orderNo });
      }
    }

    if (!firstProfile) {
      return NextResponse.json(
        { success: false, pending: true, message: 'Supplier order exists but no profile yet. Order left as PROCESSING.' },
        { status: 202 }
      );
    }

    await sendRetrySucceededEmail({
      orderNo: order.orderNo,
      customerName: order.customerName || order.customerEmail,
      customerEmail: order.customerEmail,
      packageName: order.packageName,
      destination: order.destination,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      iccid: firstProfile.iccid ?? null,
    }).catch(() => false);
    return NextResponse.json({
      success: true,
      message: customerEmailSent
        ? 'Order fulfilled successfully'
        : 'Order fulfilled, but the customer email was refused — resend it from this order.',
      customerEmailSent,
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FAILED', errorMessage: errMsg.slice(0, 1000) },
    });
    await Promise.allSettled([
      sendRetryFailedEmail({
        orderNo: order.orderNo,
        customerName: order.customerName || order.customerEmail,
        customerEmail: order.customerEmail,
        packageName: order.packageName,
        destination: order.destination,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        errorMessage: errMsg.slice(0, 300),
      }),
      checkAndAutoBlockEmail(order.customerEmail),
    ]);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
