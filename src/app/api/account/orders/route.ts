import { NextResponse } from 'next/server';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getEsimProfile, getEsimUsage } from '@/lib/esimaccess';

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
      esimOrderId: true,
      createdAt: true,
      paddleTransactionId: true,
    },
  });

  // Backfill: link any orders found by email back to this customerId
  const unlinked = orders.filter((o: typeof orders[number]) => !('customerId' in o));
  if (unlinked.length > 0) {
    await prisma.order.updateMany({
      where: { customerEmail: customer.email, customerId: null },
      data: { customerId: customer.id },
    }).catch(() => {});
  }

  // Backfill missing eSIM credentials for COMPLETED orders
  type OrderRow = typeof orders[number];
  const needsBackfill = (orders as OrderRow[]).filter(
    (o) => o.status === 'COMPLETED' && (!o.smdpAddress || !o.activationCode) && (o.esimOrderId || o.iccid)
  ).slice(0, 5);

  if (needsBackfill.length > 0) {
    await Promise.allSettled(
      needsBackfill.map(async (o: OrderRow) => {
        try {
          // Prefer esimOrderId (returns full credentials); fall back to iccid query
          const result = o.esimOrderId
            ? await getEsimProfile(o.esimOrderId)
            : null;
          const profile = result?.esimList?.[0] ?? (o.iccid ? await getEsimUsage(o.iccid) : null);
          if (!profile) return;
          const patch = {
            ...(profile.smdpAddress && { smdpAddress: profile.smdpAddress }),
            ...(profile.activationCode && { activationCode: profile.activationCode }),
            ...(profile.qrCodeUrl && { qrCodeUrl: profile.qrCodeUrl }),
          };
          if (Object.keys(patch).length === 0) return;
          await prisma.order.update({ where: { id: o.id }, data: patch });
          if (profile.smdpAddress) o.smdpAddress = profile.smdpAddress;
          if (profile.activationCode) o.activationCode = profile.activationCode;
          if (profile.qrCodeUrl) o.qrCodeUrl = profile.qrCodeUrl;
        } catch (e) {
          console.warn('[orders] backfill failed', o.id, e);
        }
      })
    );
  }

  return NextResponse.json({ orders });
}
