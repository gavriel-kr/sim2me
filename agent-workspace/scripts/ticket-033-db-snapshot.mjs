/**
 * Ticket 033 — before/after snapshot around the `Order.locale` migration.
 *
 * Reads only. Proves the additive column left every existing row untouched:
 * run it before `prisma db push`, run it again after, diff the two outputs.
 *
 *   node agent-workspace/scripts/ticket-033-db-snapshot.mjs > before.json
 */
import { config } from 'dotenv';
config();

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const FIELDS = {
  id: true, orderNo: true, status: true, totalAmount: true, currency: true,
  packageCode: true, packageName: true, destination: true, dataAmount: true,
  validity: true, iccid: true, source: true, customerEmail: true, createdAt: true,
};

try {
  const [total, byStatus, bySource, sample] = await Promise.all([
    prisma.order.count(),
    prisma.order.groupBy({ by: ['status'], _count: true }),
    prisma.order.groupBy({ by: ['source'], _count: true }),
    prisma.order.findMany({ select: FIELDS, orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  const revenue = await prisma.order.aggregate({
    _sum: { totalAmount: true, supplierCost: true },
    where: { status: 'COMPLETED' },
  });

  console.log(JSON.stringify({
    total,
    byStatus: byStatus.map((r) => ({ status: r.status, count: r._count })),
    bySource: bySource.map((r) => ({ source: r.source, count: r._count })),
    completedRevenue: String(revenue._sum.totalAmount ?? 0),
    completedSupplierCost: String(revenue._sum.supplierCost ?? 0),
    sample,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
