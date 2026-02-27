import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

interface BulkUpdateItem {
  order_id: string;
  status?: string;
}

interface Body {
  updates: BulkUpdateItem[];
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates = Array.isArray(body?.updates) ? body.updates : [];
  if (updates.length === 0) {
    return NextResponse.json({ updated: 0, total: 0, errors: [] });
  }

  const errors: string[] = [];
  let updated = 0;

  for (const item of updates) {
    const orderId = typeof item.order_id === 'string' ? item.order_id.trim() : '';
    if (!orderId) continue;

    const status =
      typeof item.status === 'string' && ALLOWED_STATUSES.includes(item.status as AllowedStatus)
        ? (item.status as AllowedStatus)
        : undefined;

    if (!status) continue;

    try {
      const result = await prisma.order.updateMany({
        where: { orderNo: orderId },
        data: { status },
      });
      if (result.count > 0) updated += result.count;
    } catch (e) {
      errors.push(`order_id ${orderId}: ${e instanceof Error ? e.message : 'update failed'}`);
    }
  }

  return NextResponse.json({ updated, total: updates.length, errors });
}
