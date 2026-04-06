import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await request.json() as { archived: boolean };
  const { archived } = body;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNo: true },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const updated = await prisma.order.update({
    where: { id },
    data: { archivedAt: archived ? new Date() : null },
    select: { archivedAt: true },
  });

  createAuditLog({
    adminEmail: session!.user!.email!,
    adminName: session!.user!.name ?? '',
    action: archived ? 'ARCHIVE_ORDER' : 'UNARCHIVE_ORDER',
    targetType: 'Order',
    targetId: id,
    details: { orderNo: order.orderNo },
  }).catch(() => {});

  return NextResponse.json({ ok: true, archivedAt: updated.archivedAt?.toISOString() ?? null });
}
