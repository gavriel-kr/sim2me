import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.packageOverride.updateMany({
    where: { customPrice: 0.70 },
    data: { customPrice: null },
  });
  console.log('Cleared', result.count, 'price floor overrides (customPrice reset to null)');
}
main().catch(console.error).finally(() => prisma.$disconnect());
