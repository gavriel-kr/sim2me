import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBalance } from '@/lib/esimaccess';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { esimOrderId: { not: null } };

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  const [orders, total, balanceData] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.order.count({ where }),
    getBalance().catch(() => null),
  ]);

  const balance = balanceData ? (balanceData.balance ?? 0) / 10000 : null;

  const totalSpent = orders.reduce((sum, o) => sum + (o.supplierCost ? Number(o.supplierCost) : 0), 0);
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      esimOrderId: o.esimOrderId,
      esimTransactionId: o.esimTransactionId,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      packageName: o.packageName,
      packageCode: o.packageCode,
      destination: o.destination,
      dataAmount: o.dataAmount,
      validity: o.validity,
      totalAmount: Number(o.totalAmount),
      supplierCost: o.supplierCost ? Number(o.supplierCost) : null,
      status: o.status,
      iccid: o.iccid ?? null,
      qrCodeUrl: o.qrCodeUrl ?? null,
      smdpAddress: o.smdpAddress ?? null,
      activationCode: o.activationCode ?? null,
      errorMessage: o.errorMessage ?? null,
      createdAt: o.createdAt.toISOString(),
    })),
    total,
    balance,
    totalSpent,
    completedCount,
  });
}
