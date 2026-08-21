import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import {
  asCheckoutLocale,
  buildPlanPageUrl,
  destinationLine,
  loadCachedPackageList,
  resolvePackageDisplayFromList,
} from '@/lib/package-display';

interface PaddleTransaction {
  id: string;
  status: string;
  customer?: { email?: string };
  custom_data?: Record<string, unknown> | null;
  items?: Array<{ price?: { name?: string } | null; quantity?: number }>;
  details?: { totals?: { total?: string; currency_code?: string } };
  created_at: string;
}

function customStr(data: Record<string, unknown> | null | undefined, key: string, max: number): string {
  const value = data?.[key];
  if (value == null) return '';
  return String(value).trim().slice(0, max);
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

    const existing = await prisma.order.findMany({
      where: { paddleTransactionId: { not: null } },
      select: { paddleTransactionId: true },
      take: 2000,
    });
    const existingIds = new Set(existing.map((o: { paddleTransactionId: string | null }) => o.paddleTransactionId!));
    const packageList = await loadCachedPackageList();

    const abandoned = transactions
      .filter((t) => !existingIds.has(t.id))
      .map((t) => {
        const custom = t.custom_data ?? undefined;
        const display = resolvePackageDisplayFromList(packageList, {
          planId: customStr(custom, 'planId', 128),
          planName: customStr(custom, 'planName', 250) || (t.items?.[0]?.price?.name ?? '').trim(),
          destinationName: customStr(custom, 'destinationName', 200),
          destinationSlug: customStr(custom, 'destinationSlug', 64),
        });
        const locale = asCheckoutLocale(customStr(custom, 'locale', 8) || null);
        return {
          paddleTransactionId: t.id,
          customerEmail: customStr(custom, 'customerEmail', 320) || t.customer?.email || null,
          customerName: customStr(custom, 'customerName', 200) || null,
          packageName: display.packageName || null,
          destination: destinationLine(display) || null,
          checkoutIp: customStr(custom, 'checkoutIp', 45) || null,
          locale,
          planUrl: buildPlanPageUrl(locale, display.destinationSlug, display.planId) ?? null,
          totalAmount: (parseFloat(t.details?.totals?.total ?? '0') || 0) / 100,
          currency: t.details?.totals?.currency_code ?? 'USD',
          createdAt: t.created_at,
          paddleStatus: t.status,
        };
      });

    return NextResponse.json({ abandoned });
  } catch (e) {
    console.error('[abandoned] Unexpected error:', e);
    return NextResponse.json({ abandoned: [] });
  }
}
