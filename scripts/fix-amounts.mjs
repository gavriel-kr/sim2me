import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const bad = await prisma.order.findMany({
  where: { totalAmount: { gt: 10 } },
  select: { id: true, totalAmount: true, packageName: true, customerEmail: true },
});

console.log('Orders with bad totalAmount:', bad);

if (bad.length > 0) {
  for (const order of bad) {
    const fixed = Number(order.totalAmount) / 100;
    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount: fixed },
    });
    console.log(`Fixed order ${order.id}: ${order.totalAmount} → ${fixed}`);
  }
} else {
  console.log('No orders to fix.');
}

await prisma.$disconnect();
