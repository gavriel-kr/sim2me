/**
 * Cron: detect new abandoned Paddle checkouts and send admin digest email.
 * Called every 30 minutes via Vercel Cron.
 * Auth: Bearer CRON_SECRET header (Vercel injects this automatically for cron jobs).
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAbandonedCheckoutEmail, AbandonedCheckoutItem } from '@/lib/email';
import { createAuditLog } from '@/lib/audit';

interface PaddleTransaction {
  id?: string;
  status?: string;
  created_at?: string;
  customer?: { email?: string } | null;
  details?: { totals?: { total?: string } } | null;
  currency_code?: string;
  custom_data?: Record<string, unknown> | null;
}

interface PaddleTransactionsResponse {
  data?: PaddleTransaction[];
  error?: { detail?: string };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'Paddle API key not configured' });
  }

  // Fetch Paddle transactions in non-completed states
  let transactions: PaddleTransaction[] = [];
  try {
    const baseApi = process.env.PADDLE_API_URL || 'https://api.paddle.com';
    const res = await fetch(
      `${baseApi}/transactions?status[]=ready&status[]=draft&per_page=100`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' },
    );
    if (res.ok) {
      const body = await res.json() as PaddleTransactionsResponse;
      transactions = body?.data ?? [];
    }
  } catch (e) {
    console.error('[check-abandoned] Paddle fetch failed', e);
    return NextResponse.json({ ok: false, error: 'Paddle API unavailable' });
  }

  // Filter: created > 30 min ago (truly abandoned, not just in-progress)
  const cutoff = Date.now() - 30 * 60 * 1000;
  const abandoned = transactions.filter((tx) => {
    if (!tx.id || !tx.created_at) return false;
    return new Date(tx.created_at).getTime() < cutoff;
  });

  if (abandoned.length === 0) {
    return NextResponse.json({ ok: true, alerted: 0 });
  }

  // Exclude orders already in DB
  const txIds = abandoned.map((tx) => tx.id!);
  const existing = await prisma.order.findMany({
    where: { paddleTransactionId: { in: txIds } },
    select: { paddleTransactionId: true },
  });
  const existingIds = new Set(existing.map((o: { paddleTransactionId: string | null }) => o.paddleTransactionId));

  // Exclude already-alerted transactions (via audit log)
  const alreadyAlerted = await prisma.adminAuditLog.findMany({
    where: { action: 'ABANDONED_CHECKOUT_ALERT', targetId: { in: txIds } },
    select: { targetId: true },
  });
  const alertedIds = new Set(alreadyAlerted.map((a: { targetId: string | null }) => a.targetId));

  const newAbandoned = abandoned.filter(
    (tx) => !existingIds.has(tx.id!) && !alertedIds.has(tx.id!),
  );

  if (newAbandoned.length === 0) {
    return NextResponse.json({ ok: true, alerted: 0 });
  }

  const now = Date.now();
  const items: AbandonedCheckoutItem[] = newAbandoned.map((tx) => {
    const createdMs = tx.created_at ? new Date(tx.created_at).getTime() : now;
    const minutesAgo = Math.round((now - createdMs) / 60000);
    const totalStr = tx.details?.totals?.total ?? '0';
    const amount = (parseFloat(totalStr) || 0) / 100;
    const email =
      (tx.custom_data?.customerEmail as string | undefined) ||
      tx.customer?.email ||
      undefined;
    return {
      paddleTransactionId: tx.id!,
      customerEmail: email,
      amount: amount || undefined,
      currency: tx.currency_code || undefined,
      minutesAgo,
    };
  });

  sendAbandonedCheckoutEmail(items);

  // Write audit log entries (fire-and-forget)
  await Promise.all(
    newAbandoned.map((tx) =>
      createAuditLog({
        adminEmail: 'cron',
        adminName: 'Cron Job',
        action: 'ABANDONED_CHECKOUT_ALERT',
        targetType: 'PaddleTransaction',
        targetId: tx.id!,
        details: { customerEmail: items.find((i) => i.paddleTransactionId === tx.id!)?.customerEmail },
      }),
    ),
  );

  return NextResponse.json({ ok: true, alerted: newAbandoned.length });
}
