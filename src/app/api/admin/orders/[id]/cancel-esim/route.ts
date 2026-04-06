import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { cancelOrder } from '@/lib/esimaccess';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNo: true, esimOrderId: true, status: true },
  });

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!order.esimOrderId) return NextResponse.json({ error: 'No eSIM order to cancel' }, { status: 400 });
  if (order.status === 'CANCELLED') return NextResponse.json({ ok: false, error: 'Order already cancelled' });

  try {
    await cancelOrder(order.esimOrderId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: `eSIMAccess error: ${msg}` });
  }

  await prisma.order.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  createAuditLog({
    adminEmail: session!.user!.email!,
    adminName: session!.user!.name ?? '',
    action: 'CANCEL_ESIM_ORDER',
    targetType: 'Order',
    targetId: id,
    details: { orderNo: order.orderNo, esimOrderId: order.esimOrderId },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
