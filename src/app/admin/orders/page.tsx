import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminOrdersClient } from './AdminOrdersClient';

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      <p className="mt-1 text-sm text-gray-500">All customer orders and their status</p>
      <AdminOrdersClient orders={orders.map((o) => ({
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
      }))} />
    </div>
  );
}
