/**
 * Paddle Billing webhook: signature verification + transaction.completed fulfillment.
 * - HMAC-SHA256 verification (no processing if invalid).
 * - On transaction.completed: create Order, call eSIM provider, update order, email the customer
 *   in the language they bought in.
 */

// Allow up to 60s for eSIMaccess profile provisioning retries
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { verifyPaddleWebhook, safeJsonParse } from '@/lib/paddle';
import { prisma } from '@/lib/prisma';
import { purchasePackage, getEsimProfileWithRetry, getPackages, formatDataVolume, getBalance } from '@/lib/esimaccess';
import { sendPostPurchaseEmail, sendOrderDelayedEmail, sendAdminOrderNotificationEmail, sendFraudAlertEmail, sendOrderFailedEmail, sendCustomerEmailFailedAlert, toEmailLocale } from '@/lib/email';
import { autoBlock, checkAndAutoBlockEmail } from '@/lib/fraud';
import { hash } from 'bcryptjs';

const EVENT_TRANSACTION_COMPLETED = 'transaction.completed';
/* Ticket 037. Paddle reports money going back out as an *adjustment* against the transaction, not as a
   transaction event: `adjustment.created` when it is raised, `adjustment.updated` when a refund that
   needed Paddle's approval becomes `approved` or `rejected`. Verified against Paddle's webhook
   reference for adjustment.created / adjustment.updated (payload: `data.action`, `data.status`,
   `data.transaction_id`). */
const EVENT_ADJUSTMENT_CREATED = 'adjustment.created';
const EVENT_ADJUSTMENT_UPDATED = 'adjustment.updated';

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

interface PaddleAdjustmentPayload {
  event_type?: string;
  data?: {
    id?: string;
    action?: string;
    status?: string;
    transaction_id?: string;
  };
}

/**
 * Money that went back to the customer, reflected on the order it belongs to.
 *
 * Deliberately narrow: it only ever *updates* an order it can find by Paddle transaction id, it never
 * creates one, and it can never set `COMPLETED`. An unknown transaction id is acknowledged rather than
 * failed, so Paddle does not retry an event we will never be able to match. Setting `REFUNDED` twice is
 * a no-op, which is what makes a replayed delivery harmless.
 */
async function handleAdjustment(payload: PaddleAdjustmentPayload): Promise<void> {
  const action = (payload.data?.action || '').toLowerCase();
  const status = (payload.data?.status || '').toLowerCase();
  const transactionId = payload.data?.transaction_id;
  if (!transactionId) return;

  /* An approved refund and a chargeback both mean the customer's money is gone from us. A refund still
     waiting on Paddle's approval, a rejected one, and a plain credit all mean nothing has moved yet. */
  const isApprovedRefund = action === 'refund' && status === 'approved';
  const isChargeback = action === 'chargeback' || action === 'chargeback_warning';
  if (!isApprovedRefund && !isChargeback) {
    console.log('[Paddle webhook] Adjustment ignored', { action, status, transactionId });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { paddleTransactionId: transactionId },
    select: { id: true, orderNo: true, status: true },
  });
  if (!order) {
    console.warn('[Paddle webhook] Adjustment for unknown transaction', { transactionId, action });
    return;
  }
  if (order.status === 'REFUNDED') return;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'REFUNDED',
      errorMessage: isChargeback ? `Chargeback raised at Paddle (${action}).` : 'Refunded at Paddle.',
    },
  });
  console.log('[Paddle webhook] Order marked REFUNDED', { orderNo: order.orderNo, action, status });
}

interface CustomData {
  planId?: string;
  customerEmail?: string;
  customerName?: string;
  userId?: string;
  deviceType?: string;
  checkoutIp?: string;
  locale?: string;
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

/**
 * eSIMaccess wallet balance in USD for the admin notification, or null.
 *
 * Wrapped twice over: the supplier call already has its own timeout, and a hung socket would still
 * leave a promise open, so a race caps it hard. Called from a detached chain, never awaited on the
 * fulfillment path — the admin wanting a fuel gauge must not be able to slow down a customer's
 * order. The supplier reports cents at $1 = 10000, the same conversion the admin dashboard uses.
 */
async function safeEsimBalanceUsd(): Promise<number | null> {
  const data = await Promise.race([
    getBalance().catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
  ]);
  return data ? (data.balance ?? 0) / 10000 : null;
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
  if (!payload) {
    return NextResponse.json({ received: true });
  }

  /* Runs inside the already-verified request — same signature check, no second entry point. */
  if (payload.event_type === EVENT_ADJUSTMENT_CREATED || payload.event_type === EVENT_ADJUSTMENT_UPDATED) {
    try {
      await handleAdjustment(payload as PaddleAdjustmentPayload);
    } catch (e) {
      console.error('[Paddle webhook] Adjustment handling failed', e);
    }
    return NextResponse.json({ received: true });
  }

  if (payload.event_type !== EVENT_TRANSACTION_COMPLETED) {
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
  // Buyer's checkout language for transactional email; legacy transactions default to Hebrew
  const emailLocale = toEmailLocale(customData.locale);
  const userId = typeof customData.userId === 'string' ? customData.userId.trim().slice(0, 64) : null;
  // Validate IP format — customData passes through browser (untrusted), only store valid IPs
  const rawIp = sanitizeString(customData.checkoutIp, 45);
  const IP_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$|^[\da-f:]{2,39}$/i;
  const checkoutIp = IP_PATTERN.test(rawIp) ? rawIp : null;

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
  let supplierCostUsd: number | undefined;

  try {
    const { packageList } = await getPackages();
    const pkg = packageList?.find((p: { packageCode: string }) => p.packageCode === planId);
    if (pkg) {
      packageName = pkg.name || planId;
      destination = pkg.location || pkg.locationCode || '';
      dataAmountStr = pkg.volume != null ? formatDataVolume(pkg.volume) : '';
      validityStr = pkg.duration != null ? `${pkg.duration} days` : '';
      // Wholesale cost in USD (API returns price in units where $1 = 10000)
      if (pkg.price != null) supplierCostUsd = pkg.price / 10000;
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
      supplierCost: supplierCostUsd ?? null,
      checkoutIp: checkoutIp || null,
      // Persisted so a later resend or retry speaks the language the customer bought in. Without
      // it every follow-up email fell back to Hebrew, whoever the buyer was.
      locale: emailLocale,
      paidAt: new Date(),
    },
  });

  /*
    Ticket 039. Every mail this handler sends is collected here and joined immediately before the
    response, rather than left running loose.

    On Vercel the instance freezes the moment the response is flushed, which suspended any send
    still in flight until that same instance happened to be thawed by a later request — an
    arbitrary delay of minutes, and an outright loss if the instance was recycled instead. The
    admin notification escaped it by being started early enough to finish during provisioning;
    the customer's mail, started on the last line, was always the one that got frozen. Hence the
    exact shape of the bug report: admin notified, customer silent.

    Sends still start where they started before, so nothing waits on anything it did not already
    wait on. Only the join at the end is new.
  */
  const pending: Promise<unknown>[] = [];

  // The balance lookup rides inside the chain so it cannot add its latency to fulfillment.
  pending.push(
    safeEsimBalanceUsd()
    .then((esimBalanceUsd) =>
      sendAdminOrderNotificationEmail({
        customerName: customerName || customerEmail,
        customerEmail,
        packageName,
        destination,
        dataAmount: dataAmountStr,
        validity: validityStr,
        amountCharged: totalAmount,
        supplierCost: supplierCostUsd ?? 0,
        orderId: order.id,
        orderNo: order.orderNo,
        adminOrdersUrl: `${baseUrl()}/admin/orders`,
        esimBalanceUsd,
      }),
    )
      .catch(() => {}),
  );

  // Safety guard: if payment is below supplier cost, block fulfillment immediately.
  // supplierCostUsd is undefined only when the package could not be resolved from the API —
  // in that case we allow the purchase to avoid blocking legitimate customers.
  if (supplierCostUsd !== undefined && totalAmount < supplierCostUsd) {
    const deficit = supplierCostUsd - totalAmount;
    console.error('[Paddle webhook] UNDERPAYMENT BLOCKED', {
      transactionId, totalAmount, supplierCostUsd, deficit, customerEmail, planId,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'FAILED',
        errorMessage: `Blocked: payment $${totalAmount.toFixed(2)} is below supplier cost $${supplierCostUsd.toFixed(2)}. Deficit: $${deficit.toFixed(2)}.`,
      },
    });
    pending.push(
      sendFraudAlertEmail({
        customerName: customerName || customerEmail,
        customerEmail,
        packageName,
        destination,
        amountPaid: totalAmount,
        supplierCost: supplierCostUsd,
        deficit,
        paddleTransactionId: transactionId,
        orderId: order.id,
        orderNo: order.orderNo,
        adminOrdersUrl: `${baseUrl()}/admin/orders`,
      }).catch(() => {}),
    );
    pending.push(
      sendOrderFailedEmail({
        orderNo: order.orderNo,
        customerName: customerName || customerEmail,
        customerEmail,
        packageName,
        destination,
        totalAmount,
        currency,
        errorMessage: `Blocked: underpayment $${totalAmount.toFixed(2)} vs supplier cost $${supplierCostUsd.toFixed(2)}`,
      }).catch(() => {}),
    );
    // Auto-block email immediately — email is validated and not spoofable
    // Note: checkoutIp travels via customData (browser-controlled) so we don't auto-block
    // by IP here; IP blocking is enforced at checkout time using the real server IP
    pending.push(autoBlock('EMAIL', customerEmail, 'Underpayment fraud').catch(() => {}));
    await Promise.allSettled(pending);
    return NextResponse.json({ received: true });
  }

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

    // Retry up to 5 times with 5s delay — eSIMaccess may take time to provision the profile
    const profileResult = await getEsimProfileWithRetry(orderNo, 5, 5000);
    const firstProfile = profileResult?.esimList?.[0];

    /* Ticket 037. COMPLETED used to be set unconditionally, so an order with no profile in it told the
       customer their eSIM was ready and showed them an empty install panel. The status is now
       conditional on the same thing the profile fields are: no profile means fulfilment is still in
       flight, which is `PROCESSING`. The supplier order id is already recorded above, so the retry
       guard can re-fetch rather than buy a second eSIM. */
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

    // Auto-create or find customer account, link order
    let tempPassword: string | null = null;
    try {
      let customer = await prisma.customer.findUnique({ where: { email: customerEmail } });
      if (!customer) {
        tempPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
        const hashed = await hash(tempPassword, 10);
        const nameParts = (customerName || '').trim().split(' ');
        customer = await prisma.customer.create({
          data: {
            email: customerEmail,
            name: nameParts[0] || customerName || '',
            lastName: nameParts.slice(1).join(' ') || null,
            password: hashed,
            // Purchase email delivery proves inbox ownership — without this flag the
            // temp password we email below is unusable (login blocks unverified customers)
            emailVerified: true,
          },
        });
      }
      await prisma.order.update({ where: { id: order.id }, data: { customerId: customer.id } });
    } catch (e) {
      console.warn('[Paddle webhook] Customer upsert failed (non-fatal)', e);
    }

    // Send email independently — never fail the order if email fails
    const accountLink = `${baseUrl()}/${emailLocale}/account`;
    if (firstProfile) {
      pending.push(
        sendPostPurchaseEmail(customerEmail, {
          customerName: customerName || 'Customer',
          planName: packageName,
          dataGb: dataAmountStr,
          validityDays: validityStr,
          qrCodeUrl: firstProfile.qrCodeUrl || null,
          smdpAddress: firstProfile.smdpAddress,
          activationCode: firstProfile.activationCode,
          loginLink: accountLink,
          email: customerEmail,
          tempPassword,
          orderNo: order.orderNo,
          amountPaid: totalAmount,
          currency,
          orderDate: order.paidAt ?? order.createdAt,
          iccid: firstProfile.iccid ?? null,
        }, emailLocale)
          // A paid, provisioned order whose mail did not go out is the one failure the customer
          // finds before we do, so it is escalated rather than logged.
          .then((ok) => {
            if (ok) return null;
            console.error('[Paddle webhook] Post-purchase email rejected', { orderNo: order.orderNo, customerEmail });
            return sendCustomerEmailFailedAlert({
              kind: 'eSIM delivery (post-purchase)',
              customerEmail,
              orderNo: order.orderNo,
              locale: emailLocale,
            });
          })
          .catch((e) => console.error('[Paddle webhook] Email send failed (non-fatal)', e)),
      );
    } else {
      // Paid, provisioned at the supplier, but no profile came back within the retry window. This
      // branch used to send nothing at all, so a customer who had just been charged heard silence.
      pending.push(
        sendOrderDelayedEmail(customerEmail, {
          customerName: customerName || 'Customer',
          orderNo: order.orderNo,
          planName: packageName,
          amountPaid: totalAmount,
          currency,
          accountLink,
        }, emailLocale)
          .then((ok) => {
            if (ok) return null;
            console.error('[Paddle webhook] Delayed email rejected', { orderNo: order.orderNo, customerEmail });
            return sendCustomerEmailFailedAlert({
              kind: 'order delayed',
              customerEmail,
              orderNo: order.orderNo,
              locale: emailLocale,
            });
          })
          .catch((e) => console.error('[Paddle webhook] Delayed email failed (non-fatal)', e)),
      );
    }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error('[Paddle webhook] Fulfillment failed', order.id, errMsg);
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FAILED', errorMessage: errMsg.slice(0, 1000) },
    });
    pending.push(
      sendOrderFailedEmail({
        orderNo: order.orderNo,
        customerName: customerName || customerEmail,
        customerEmail,
        packageName,
        destination,
        totalAmount,
        currency,
        errorMessage: errMsg.slice(0, 300),
      }).catch(() => {}),
    );
    // The customer paid. Whatever broke on our side, they get told something — never the error
    // itself, which is for the admin alert above.
    pending.push(
      sendOrderDelayedEmail(customerEmail, {
        customerName: customerName || 'Customer',
        orderNo: order.orderNo,
        planName: packageName,
        amountPaid: totalAmount,
        currency,
        accountLink: `${baseUrl()}/${emailLocale}/account`,
      }, emailLocale)
        .then((ok) => {
          if (ok) return null;
          console.error('[Paddle webhook] Delayed email rejected after failure', { orderNo: order.orderNo, customerEmail });
          return sendCustomerEmailFailedAlert({
            kind: 'order delayed (after fulfilment failure)',
            customerEmail,
            orderNo: order.orderNo,
            locale: emailLocale,
          });
        })
        .catch(() => {}),
    );
    pending.push(checkAndAutoBlockEmail(customerEmail).catch(() => {}));
  }

  /*
    Ticket 039. The join. Nothing above is awaited at its call site, so the sends still overlap
    each other and overlap provisioning; this is the single point where the handler waits for all
    of them. `allSettled`, never `all`: a refused mail must not turn a captured payment into a
    non-2xx, which would make Paddle retry a transaction that has already been fulfilled.
  */
  await Promise.allSettled(pending);

  return NextResponse.json({ received: true });
}
