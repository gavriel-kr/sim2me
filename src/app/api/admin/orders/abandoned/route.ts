import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

interface PaddleTransaction {
  id: string;
  status: string;
  customer?: { email?: string };
  details?: { totals?: { total?: string; currency_code?: string } };
  created_at: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ abandoned: [] });
  }

  try {
    const paddleRes = await fetch(
      'https://api.paddle.com/transactions?status[]=ready&status[]=draft&per_page=50&order_by=created_at[DESC]',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      },
    );

    if (!paddleRes.ok) {
      console.error('[abandoned] Paddle API error:', paddleRes.status, await paddleRes.text());
      return NextResponse.json({ abandoned: [] });
    }

    const paddleData = await paddleRes.json() as { data?: PaddleTransaction[] };
    const transactions: PaddleTransaction[] = paddleData?.data ?? [];

    // Fetch existing paddleTransactionIds from DB to de-duplicate
    const existing = await prisma.order.findMany({
      where: { paddleTransactionId: { not: null } },
      select: { paddleTransactionId: true },
      take: 2000,
    });
    const existingIds = new Set(existing.map((o: { paddleTransactionId: string | null }) => o.paddleTransactionId!));

    // Show all draft/ready transactions not already in DB (Paddle handles expiry via status change)
    const abandoned = transactions
      .filter((t) => !existingIds.has(t.id))
      .map((t) => ({
        paddleTransactionId: t.id,
        customerEmail: t.customer?.email ?? null,
        totalAmount: parseFloat(t.details?.totals?.total ?? '0') || 0,
        currency: t.details?.totals?.currency_code ?? 'USD',
        createdAt: t.created_at,
        paddleStatus: t.status,
      }));

    return NextResponse.json({ abandoned });
  } catch (e) {
    console.error('[abandoned] Unexpected error:', e);
    return NextResponse.json({ abandoned: [] });
  }
}
