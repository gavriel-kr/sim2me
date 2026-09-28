import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { cancelOrder } from '@/lib/esimaccess';
import { createAuditLog } from '@/lib/audit';
import { sendEsimCancelledEmail } from '@/lib/email';

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
    select: { id: true, orderNo: true, esimOrderId: true, packageCode: true, iccid: true, status: true, customerName: true, customerEmail: true, packageName: true, destination: true, totalAmount: true, currency: true },
  });

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!order.esimOrderId) return NextResponse.json({ error: 'No eSIM order to cancel' }, { status: 400 });
  if (order.status === 'CANCELLED') return NextResponse.json({ ok: false, error: 'Order already cancelled' });

  /* Ticket 042: PikaSim does not cancel phone plans through the API (their support, 2026-09-28: "phone
     plans cannot be cancelled through the API; those need a support ticket and depend on the upstream
     operator's approval"). So the API is not called for them; the admin is told where to go instead. */
  if (order.packageCode.startsWith('rn:')) {
    return NextResponse.json({ ok: false, error: 'A renewal adds time to an existing eSIM and cannot be cancelled on its own' });
  }
  if (order.packageCode.startsWith('pk:')) {
    return NextResponse.json({
      ok: false,
      error: `Phone plans cannot be cancelled through the PikaSim API. Open a support ticket in the PikaSim dashboard with ICCID ${order.iccid ?? '(none yet)'}; cancellation depends on the operator's approval.`,
    });
  }
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

  // Ticket 039: awaited, so the cancellation record cannot be lost to a frozen instance.
  await sendEsimCancelledEmail({
    orderNo: order.orderNo,
    customerName: order.customerName || order.customerEmail,
    customerEmail: order.customerEmail,
    packageName: order.packageName,
    destination: order.destination,
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
  }).catch(() => false);

  return NextResponse.json({ ok: true });
}
