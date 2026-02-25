import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BarChart3, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { BackfillBanner } from './BackfillBanner';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  // Fetch stats and fee config for tile
  const [orderCount, customerCount, completedAgg, recentOrders, feeSettings, additionalFeesCount] = await Promise.all([
    prisma.order.count(),
    prisma.customer.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true, supplierCost: true },
      where: { status: 'COMPLETED' },
    }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.feeSettings.findFirst(),
    prisma.additionalFee.count({ where: { isActive: true } }),
  ]);

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
    { label: 'Avg. Order', value: completedCount > 0 ? `$${(revenue / completedCount).toFixed(2)}` : '$0', icon: BarChart3, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Welcome back, {session.user?.name}</p>

      <BackfillBanner missingCount={missingCostCount} />

      {/* Stats grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      {/* Fee config tile */}
      <div className="mt-6">
        <Link
          href="/admin/packages/fees"
          className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Paddle: {feeSettings ? `${Number(feeSettings.paddlePercentageFee) * 100}% + $${Number(feeSettings.paddleFixedFee).toFixed(2)}` : '5% + $0.50'}
              </p>
              <p className="text-xs text-gray-500">
                {additionalFeesCount > 0
                  ? `${additionalFeesCount} active additional fee${additionalFeesCount === 1 ? '' : 's'}`
                  : 'No additional fees'}
                {' · Edit fees'}
              </p>
            </div>
          </div>
        </Link>
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
