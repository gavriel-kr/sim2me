import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { paddleFeeAmount } from '@/lib/profit';
import { AdminOrdersClient } from './AdminOrdersClient';
import type { CubickStat } from '../DashboardCubicks';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    country?: string;
    from?: string;
    to?: string;
    archived?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 50;

// OrderStatus values that exist in the DB (ABANDONED is Paddle-only, not a DB enum value)
const DB_STATUSES = new Set(['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']);

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const statusParam = (params.status ?? '').trim();
  const country = (params.country ?? '').trim();
  const from = (params.from ?? '').trim();
  const to = (params.to ?? '').trim();
  const archived = params.archived ?? 'active'; // 'active' | 'archived' | 'all'
  const MAX_PAGE = 500;
  const page = Math.min(MAX_PAGE, Math.max(1, parseInt(params.page ?? '1') || 1));

  // Build Prisma where clause
  const where: Prisma.OrderWhereInput = {};

  // Full-text search: orderNo, email, name, ICCID, checkoutIp
  if (q) {
    where.OR = [
      { orderNo: { contains: q, mode: 'insensitive' } },
      { customerEmail: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { iccid: { contains: q, mode: 'insensitive' } },
      { checkoutIp: { contains: q } },
    ];
  }

  // Status — comma-separated multi-select; ABANDONED is Paddle-only (not a DB enum)
  if (statusParam) {
    const statuses = statusParam.split(',').map((s) => s.trim()).filter((s) => DB_STATUSES.has(s));
    if (statuses.length === 1) {
      where.status = statuses[0] as Prisma.EnumOrderStatusFilter['equals'];
    } else if (statuses.length > 1) {
      where.status = { in: statuses as never[] };
    }
  }

  // Country (destination)
  if (country) where.destination = country;

  // Date range
  if (from || to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (from) createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      createdAt.lte = toDate;
    }
    where.createdAt = createdAt;
  }

  // Archived filter
  if (archived === 'active') where.archivedAt = null;
  else if (archived === 'archived') where.archivedAt = { not: null };
  // 'all' → no filter

  // If ABANDONED-only is selected, return 0 DB orders
  const selectedStatuses = statusParam ? statusParam.split(',').map((s) => s.trim()) : [];
  const isAbandonedOnly = selectedStatuses.length > 0 && selectedStatuses.every((s) => s === 'ABANDONED');

  const pctFee = 0.05;
  const fixedFee = 0.5;

  const [
    orders,
    totalCount,
    orderCount,
    customerCount,
    completedAgg,
    allEsimCostAgg,
    completedOrderAmounts,
    feeSettings,
    destinationRows,
  ] = await Promise.all([
    isAbandonedOnly
      ? Promise.resolve([])
      : prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
    isAbandonedOnly
      ? Promise.resolve(0)
      : prisma.order.count({ where }),
    prisma.order.count(),
    prisma.customer.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: 'COMPLETED' } }),
    prisma.order.aggregate({ _sum: { supplierCost: true }, where: { esimOrderId: { not: null } } }),
    prisma.order.findMany({ where: { status: 'COMPLETED', paddleTransactionId: { not: null } }, select: { totalAmount: true } }),
    prisma.feeSettings.findFirst(),
    prisma.order.findMany({ select: { destination: true }, distinct: ['destination'], orderBy: { destination: 'asc' } }),
  ]);

  const availableCountries = destinationRows
    .map((r: { destination: string }) => r.destination)
    .filter(Boolean)
    .sort();

  const pct = feeSettings ? Number(feeSettings.paddlePercentageFee) : pctFee;
  const fixed = feeSettings ? Number(feeSettings.paddleFixedFee) : fixedFee;
  let feeCost = 0;
  let revenueAfterFees = 0;
  for (const o of completedOrderAmounts) {
    const amt = Number(o.totalAmount);
    const fee = paddleFeeAmount(amt, pct, fixed);
    feeCost += fee;
    revenueAfterFees += amt - fee;
  }

  const revenue = Number(completedAgg._sum.totalAmount || 0);
  const esimCost = Number(allEsimCostAgg._sum.supplierCost || 0);
  const profit = revenue - esimCost - feeCost;
  const completedCount = completedOrderAmounts.length;

  const stats: CubickStat[] = [
    { label: 'Total Orders', value: orderCount, iconName: 'ShoppingCart', color: 'bg-blue-100 text-blue-600' },
    { label: 'Revenue', value: `$${revenue.toFixed(2)}`, iconName: 'DollarSign', color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Esim cost', value: `$${esimCost.toFixed(2)}`, iconName: 'TrendingDown', color: 'bg-red-100 text-red-600' },
    { label: 'Profit', value: `$${profit.toFixed(2)}`, iconName: 'TrendingUp', color: profit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600' },
    { label: 'Customers', value: customerCount, iconName: 'Users', color: 'bg-violet-100 text-violet-600' },
    { label: 'Fee cost', value: `$${feeCost.toFixed(2)}`, iconName: 'Receipt', color: 'bg-orange-100 text-orange-600' },
    { label: 'Net in bank', value: `$${revenueAfterFees.toFixed(2)}`, iconName: 'Wallet', color: 'bg-sky-100 text-sky-600' },
    { label: 'Avg. Order', value: completedCount > 0 ? `$${(revenue / completedCount).toFixed(2)}` : '$0', iconName: 'BarChart3', color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      <p className="mt-1 text-sm text-gray-500">All customer orders and their status</p>
      <AdminOrdersClient
        stats={stats}
        orders={orders.map((o: typeof orders[number]) => ({
          id: o.id,
          orderNo: o.orderNo,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          packageName: o.packageName,
          destination: o.destination,
          totalAmount: Number(o.totalAmount),
          currency: o.currency,
          status: o.status,
          errorMessage: o.errorMessage ?? null,
          qrCodeUrl: o.qrCodeUrl ?? null,
          smdpAddress: o.smdpAddress ?? null,
          activationCode: o.activationCode ?? null,
          iccid: o.iccid ?? null,
          paddleTransactionId: o.paddleTransactionId ?? null,
          esimOrderId: o.esimOrderId ?? null,
          notes: o.notes ?? null,
          archivedAt: o.archivedAt?.toISOString() ?? null,
          createdAt: o.createdAt.toISOString(),
          checkoutIp: o.checkoutIp ?? null,
        }))}
        totalCount={totalCount}
        currentPage={page}
        pageSize={PAGE_SIZE}
        initialFilters={{ q, status: statusParam, country, from, to, archived }}
        availableCountries={availableCountries}
      />
    </div>
  );
}
