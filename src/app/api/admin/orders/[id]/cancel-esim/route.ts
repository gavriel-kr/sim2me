import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { cancelOrder } from '@/lib/esimaccess';
import { cancelPikaEsim } from '@/lib/pikasim';
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

  // Ticket 042: a PikaSim eSIM is cancelled at PikaSim, by ICCID. Phone plans are mostly refused
  // there (country plans never refund, US/global go to a support ticket); the admin sees their answer.
  if (order.packageCode.startsWith('rn:')) {
    return NextResponse.json({ ok: false, error: 'A renewal adds time to an existing eSIM and cannot be cancelled on its own' });
  }
  const isPika = order.packageCode.startsWith('pk:');
  try {
    if (isPika) {
      if (!order.iccid) return NextResponse.json({ ok: false, error: 'PikaSim cancels by ICCID, and this order has none yet' });
      await cancelPikaEsim(order.iccid);
    } else {
      await cancelOrder(order.esimOrderId);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: `${isPika ? 'PikaSim' : 'eSIMAccess'} error: ${msg}` });
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
