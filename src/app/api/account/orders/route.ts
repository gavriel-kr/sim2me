import { NextResponse } from 'next/server';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getSessionForRequest(request);
  if (!isCustomerSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = session.user.id;

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, email: true },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Fetch by customerId OR by matching email (for historical orders without customerId)
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerId: customer.id },
        { customerEmail: customer.email },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      packageName: true,
      destination: true,
      dataAmount: true,
      validity: true,
      totalAmount: true,
      currency: true,
      status: true,
      iccid: true,
      qrCodeUrl: true,
      smdpAddress: true,
      activationCode: true,
      createdAt: true,
      paddleTransactionId: true,
    },
  });

  // Backfill: link any orders found by email back to this customerId
  const unlinked = orders.filter((o) => !('customerId' in o));
  if (unlinked.length > 0) {
    await prisma.order.updateMany({
      where: { customerEmail: customer.email, customerId: null },
      data: { customerId: customer.id },
    }).catch(() => {});
  }

  return NextResponse.json({ orders });
}
