/**
 * Paddle Billing webhook: signature verification + transaction.completed fulfillment.
 * - HMAC-SHA256 verification (no processing if invalid).
 * - On transaction.completed: create Order, call eSIM provider, update order, send Hebrew email.
 */

import { NextResponse } from 'next/server';
import { verifyPaddleWebhook, safeJsonParse } from '@/lib/paddle';
import { prisma } from '@/lib/prisma';
import { purchasePackage, getEsimProfile, getPackages, formatDataVolume } from '@/lib/esimaccess';
import { sendPostPurchaseEmail } from '@/lib/email';

const EVENT_TRANSACTION_COMPLETED = 'transaction.completed';

interface PaddleWebhookPayload {
  event_id?: string;
  event_type?: string;
  data?: {
    id?: string;
    status?: string;
    customer_id?: string | null;
    custom_data?: Record<string, unknown> | null;
    currency_code?: string;
    items?: Array<{ price?: { id?: string }; quantity?: number }>;
    details?: { totals?: { total?: string }; tax?: string };
  };
}

interface CustomData {
  planId?: string;
  customerEmail?: string;
  customerName?: string;
  userId?: string;
  deviceType?: string;
}

function baseUrl(): string {
  const u = process.env.NEXT_PUBLIC_SITE_URL;
  return u ? u.replace(/\/$/, '') : 'https://www.sim2me.net';
}

function sanitizeString(s: unknown, maxLen: number): string {
  if (s == null) return '';
  const t = String(s).trim().slice(0, maxLen);
  return t.replace(/[<>\"'&]/g, '');
}

export async function POST(request: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Paddle webhook] PADDLE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const signature = request.headers.get('paddle-signature');
  if (!verifyPaddleWebhook(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = safeJsonParse<PaddleWebhookPayload>(rawBody);
  if (!payload || payload.event_type !== EVENT_TRANSACTION_COMPLETED) {
    return NextResponse.json({ received: true });
  }

  const data = payload.data;
  const transactionId = data?.id;
  if (!transactionId || !data) {
    return NextResponse.json({ received: true });
  }

  const existing = await prisma.order.findUnique({ where: { paddleTransactionId: transactionId } });
  if (existing) {
    return NextResponse.json({ received: true });
  }

  const customData = (data.custom_data || {}) as CustomData;
  const planId = sanitizeString(customData.planId, 128);
  const customerEmail = sanitizeString(customData.customerEmail, 320);
  const customerName = sanitizeString(customData.customerName, 200);
  const deviceType = sanitizeString(customData.deviceType, 64);
  const userId = typeof customData.userId === 'string' ? customData.userId.trim().slice(0, 64) : null;

  if (!planId || !customerEmail) {
    console.error('[Paddle webhook] Missing planId or customerEmail in custom_data', { transactionId, customData });
    return NextResponse.json({ received: true });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerEmail)) {
    console.error('[Paddle webhook] Invalid customerEmail', { customerEmail });
    return NextResponse.json({ received: true });
  }

  let packageName = planId;
  let destination = '';
  let dataAmountStr = '';
  let validityStr = '';

  try {
    const { packageList } = await getPackages();
    const pkg = packageList?.find((p: { packageCode: string }) => p.packageCode === planId);
    if (pkg) {
      packageName = pkg.name || planId;
      destination = pkg.location || pkg.locationCode || '';
      dataAmountStr = pkg.volume != null ? formatDataVolume(pkg.volume) : '';
      validityStr = pkg.duration != null ? `${pkg.duration} days` : '';
    }
  } catch (e) {
    console.warn('[Paddle webhook] Could not resolve package details', e);
  }

  const totalStr = data.details?.totals?.total ?? '0';
  // Paddle totals are in the currency's minor unit (cents for USD)
  const totalAmount = Math.max(0, (parseFloat(totalStr) || 0) / 100);
  const currency = (data.currency_code || 'USD').toUpperCase().slice(0, 3);

  const order = await prisma.order.create({
    data: {
      customerEmail,
      customerName: customerName || customerEmail,
      customerId: userId || null,
      status: 'PROCESSING',
      totalAmount,
      currency,
      paddleTransactionId: transactionId,
      packageCode: planId,
      packageName,
      destination,
      dataAmount: dataAmountStr,
      validity: validityStr,
      deviceType: deviceType || null,
      paidAt: new Date(),
    },
  });

  try {
    const purchase = await purchasePackage(planId, 1);
    const orderNo = purchase.orderNo;
    const esimTxnId = purchase.transactionId;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        esimOrderId: orderNo,
        esimTransactionId: esimTxnId,
      },
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

    // Send email independently — never fail the order if email fails
    if (firstProfile) {
      const loginLink = `${baseUrl()}/account`;
      sendPostPurchaseEmail(customerEmail, {
        customerName: customerName || 'Customer',
        planName: packageName,
        dataGb: dataAmountStr,
        validityDays: validityStr,
        qrCodeUrl: firstProfile.qrCodeUrl || null,
        smdpAddress: firstProfile.smdpAddress,
        activationCode: firstProfile.activationCode,
        loginLink,
        email: customerEmail,
      }).catch((e) => console.error('[Paddle webhook] Email send failed (non-fatal)', e));
    }
  } catch (e) {
    console.error('[Paddle webhook] Fulfillment failed', order.id, e);
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FAILED' },
    });
  }

  return NextResponse.json({ received: true });
}
