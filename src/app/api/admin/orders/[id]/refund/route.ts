import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { sendRefundIssuedEmail } from '@/lib/email';

interface PaddleTransactionItem {
  id: string;
}

interface PaddleTransactionResponse {
  data?: { items?: PaddleTransactionItem[] };
  error?: { detail?: string; type?: string };
}

interface PaddleAdjustmentResponse {
  data?: { id: string };
  error?: { detail?: string; type?: string };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, error: 'Paddle API key not configured' });

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNo: true, paddleTransactionId: true, status: true, totalAmount: true, currency: true, customerName: true, customerEmail: true, packageName: true, destination: true },
  });

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!order.paddleTransactionId) return NextResponse.json({ ok: false, error: 'No Paddle transaction on this order' });
  if (order.status === 'REFUNDED') return NextResponse.json({ ok: false, error: 'Order already refunded' });

  // Fetch transaction from Paddle to get line item IDs needed for refund
  let lineItemIds: string[] = [];
  try {
    const txRes = await fetch(`https://api.paddle.com/transactions/${order.paddleTransactionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    if (txRes.ok) {
      const txData = await txRes.json() as PaddleTransactionResponse;
      lineItemIds = (txData?.data?.items ?? []).map((item) => item.id).filter(Boolean);
    }
  } catch (e) {
    console.error('[refund] Failed to fetch Paddle transaction:', e);
  }

  if (lineItemIds.length === 0) {
    return NextResponse.json({
      ok: false,
      error: 'Could not retrieve Paddle transaction line items. Please issue the refund manually in the Paddle Dashboard.',
    });
  }

  // Issue refund via Paddle Adjustments API
  try {
    const refundRes = await fetch('https://api.paddle.com/adjustments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'refund',
        transaction_id: order.paddleTransactionId,
        reason: 'Refund issued by admin',
        items: lineItemIds.map((item_id) => ({ item_id, type: 'full' })),
      }),
    });

    const refundData = await refundRes.json() as PaddleAdjustmentResponse;

    if (!refundRes.ok) {
      const errMsg = refundData?.error?.detail ?? `Paddle error: ${refundRes.status}`;
      return NextResponse.json({ ok: false, error: errMsg });
    }

    await prisma.order.update({ where: { id }, data: { status: 'REFUNDED' } });

    createAuditLog({
      adminEmail: session!.user!.email!,
      adminName: session!.user!.name ?? '',
      action: 'REFUND_ORDER',
      targetType: 'Order',
      targetId: id,
      details: {
        orderNo: order.orderNo,
        paddleTransactionId: order.paddleTransactionId,
        amount: Number(order.totalAmount),
        currency: order.currency,
        customerName: order.customerName,
      },
    }).catch(() => {});

    sendRefundIssuedEmail({
      orderNo: order.orderNo,
      customerName: order.customerName || order.customerEmail,
      customerEmail: order.customerEmail,
      packageName: order.packageName,
      destination: order.destination,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg });
  }
}
