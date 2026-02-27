import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { paddleFeeAmount } from '@/lib/profit';
import { AdminOrdersClient } from './AdminOrdersClient';
import type { CubickStat } from '../DashboardCubicks';

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const pctFee = 0.05;
  const fixedFee = 0.5;

  const [orders, orderCount, customerCount, completedAgg, allEsimCostAgg, completedOrderAmounts, feeSettings] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
    prisma.order.count(),
    prisma.customer.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'COMPLETED' },
    }),
    // All actual eSIMaccess charges (regardless of order status)
    prisma.order.aggregate({
      _sum: { supplierCost: true },
      where: { esimOrderId: { not: null } },
    }),
    // Only real Paddle transactions — test/admin orders with no paddleTransactionId have no fee
    prisma.order.findMany({ where: { status: 'COMPLETED', paddleTransactionId: { not: null } }, select: { totalAmount: true } }),
    prisma.feeSettings.findFirst(),
  ]);

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
        orders={orders.map((o) => ({
          id: o.id,
          orderNo: o.orderNo,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          packageName: o.packageName,
          destination: o.destination,
          totalAmount: Number(o.totalAmount),
          status: o.status,
          errorMessage: o.errorMessage ?? null,
          qrCodeUrl: o.qrCodeUrl ?? null,
          smdpAddress: o.smdpAddress ?? null,
          activationCode: o.activationCode ?? null,
          iccid: o.iccid ?? null,
          paddleTransactionId: o.paddleTransactionId ?? null,
          createdAt: o.createdAt.toLocaleDateString(),
        }))}
      />
    </div>
  );
}
