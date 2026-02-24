import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const orders = await prisma.order.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5,
  select: {
    id: true,
    packageName: true,
    status: true,
    errorMessage: true,
    customerEmail: true,
    iccid: true,
    qrCodeUrl: true,
    esimOrderId: true,
    createdAt: true,
  },
});

console.log(JSON.stringify(orders, null, 2));
await prisma.$disconnect();
