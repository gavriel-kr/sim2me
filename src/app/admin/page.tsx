import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BackfillBanner } from './BackfillBanner';
import { DashboardCubicks } from './DashboardCubicks';
import { paddleFeeAmount } from '@/lib/profit';
import { getBalance } from '@/lib/esimaccess';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const pctFee = 0.05;
  const fixedFee = 0.5;

  // Fetch stats and fee config
  const [orderCount, customerCount, completedAgg, allEsimCostAgg, completedOrderAmounts, recentOrders, feeSettings, esimAdditionalCostSetting] = await Promise.all([
    prisma.order.count(),
    prisma.customer.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'COMPLETED' },
    }),
    // Sum supplierCost for ALL orders where eSIMaccess was actually charged
    // (esimOrderId is set the moment purchasePackage() succeeds, even if the order later fails)
    prisma.order.aggregate({
      _sum: { supplierCost: true },
      where: { esimOrderId: { not: null } },
    }),
    prisma.order.findMany({ where: { status: 'COMPLETED' }, select: { totalAmount: true } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.feeSettings.findFirst(),
    // Manual adjustment for test/direct purchases made outside the app
    prisma.siteSetting.findUnique({ where: { key: 'esim_additional_cost' } }),
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
  // Tracked eSIM spend (orders that hit eSIMaccess) + manual adjustment for outside-app purchases
  const esimAdditionalCost = esimAdditionalCostSetting ? parseFloat(esimAdditionalCostSetting.value) || 0 : 0;
  const esimCost = Number(allEsimCostAgg._sum.supplierCost || 0) + esimAdditionalCost;
  const profit = revenue - esimCost - feeCost;
  const [completedCount, missingCostCount, balanceData] = await Promise.all([
    prisma.order.count({ where: { status: 'COMPLETED' } }),
    // Orders where eSIMaccess was charged but supplierCost was never recorded
    prisma.order.count({ where: { esimOrderId: { not: null }, supplierCost: null } }),
    getBalance().catch(() => null),
  ]);

  const esimAccessBalance = balanceData ? (balanceData.balance ?? 0) / 10000 : null;

  const stats = [
    { label: 'Total Orders', value: orderCount, iconName: 'ShoppingCart' as const, color: 'bg-blue-100 text-blue-600' },
    { label: 'Revenue', value: `$${revenue.toFixed(2)}`, iconName: 'DollarSign' as const, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Esim cost', value: `$${esimCost.toFixed(2)}`, iconName: 'TrendingDown' as const, color: 'bg-red-100 text-red-600' },
    { label: 'Profit', value: `$${profit.toFixed(2)}`, iconName: 'TrendingUp' as const, color: profit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600' },
    { label: 'Customers', value: customerCount, iconName: 'Users' as const, color: 'bg-violet-100 text-violet-600' },
    { label: 'Fee cost', value: `$${feeCost.toFixed(2)}`, iconName: 'Receipt' as const, color: 'bg-orange-100 text-orange-600' },
    { label: 'Net in bank', value: `$${revenueAfterFees.toFixed(2)}`, iconName: 'Wallet' as const, color: 'bg-sky-100 text-sky-600' },
    { label: 'Avg. Order', value: completedCount > 0 ? `$${(revenue / completedCount).toFixed(2)}` : '$0', iconName: 'BarChart3' as const, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Welcome back, {session.user?.name}</p>

      <BackfillBanner missingCount={missingCostCount} />

      <DashboardCubicks stats={stats} />

      {esimAccessBalance !== null && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-gray-500">eSIMaccess balance:</span>
          <span className={`font-semibold ${esimAccessBalance < 10 ? 'text-red-600' : 'text-emerald-600'}`}>
            ${esimAccessBalance.toFixed(2)}
          </span>
        </div>
      )}

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
