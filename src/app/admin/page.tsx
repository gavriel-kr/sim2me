import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BarChart3, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { BackfillBanner } from './BackfillBanner';
import { paddleFeeAmount } from '@/lib/profit';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const pctFee = 0.05;
  const fixedFee = 0.5;

  // Fetch stats and fee config
  const [orderCount, customerCount, completedAgg, completedOrderAmounts, recentOrders, feeSettings] = await Promise.all([
    prisma.order.count(),
    prisma.customer.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true, supplierCost: true },
      where: { status: 'COMPLETED' },
    }),
    prisma.order.findMany({ where: { status: 'COMPLETED' }, select: { totalAmount: true } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.feeSettings.findFirst(),
  ]);

  const pct = feeSettings ? Number(feeSettings.paddlePercentageFee) : pctFee;
  const fixed = feeSettings ? Number(feeSettings.paddleFixedFee) : fixedFee;
  const revenueAfterFees = completedOrderAmounts.reduce(
    (sum, o) => sum + Number(o.totalAmount) - paddleFeeAmount(Number(o.totalAmount), pct, fixed),
    0
  );

  const revenue = Number(completedAgg._sum.totalAmount || 0);
  const cost = Number(completedAgg._sum.supplierCost || 0);
  const profit = revenue - cost;
  const [completedCount, missingCostCount] = await Promise.all([
    prisma.order.count({ where: { status: 'COMPLETED' } }),
    prisma.order.count({ where: { supplierCost: null, status: { in: ['COMPLETED', 'PROCESSING'] } } }),
  ]);

  const stats = [
    { label: 'Total Orders', value: orderCount, icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' },
    { label: 'Revenue', value: `$${revenue.toFixed(2)}`, icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Cost', value: `$${cost.toFixed(2)}`, icon: TrendingDown, color: 'bg-red-100 text-red-600' },
    { label: 'Profit', value: `$${profit.toFixed(2)}`, icon: TrendingUp, color: profit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600' },
    { label: 'Customers', value: customerCount, icon: Users, color: 'bg-violet-100 text-violet-600' },
    { label: 'Revenue after fees', value: `$${revenueAfterFees.toFixed(2)}`, icon: Wallet, color: 'bg-sky-100 text-sky-600' },
    { label: 'Avg. Order', value: completedCount > 0 ? `$${(revenue / completedCount).toFixed(2)}` : '$0', icon: BarChart3, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Welcome back, {session.user?.name}</p>

      <BackfillBanner missingCount={missingCostCount} />

      {/* Stats grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No orders yet. Orders will appear here once customers start purchasing.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{order.orderNo.slice(0, 12)}...</td>
                    <td className="px-4 py-3 text-gray-600">{order.customerEmail}</td>
                    <td className="px-4 py-3 text-gray-600">{order.packageName}</td>
                    <td className="px-4 py-3 font-semibold">${Number(order.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{order.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
