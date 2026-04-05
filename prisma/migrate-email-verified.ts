import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.customer.updateMany({
    where: { emailVerified: false },
    data: { emailVerified: true },
  });
  console.log(`Migrated ${result.count} existing customers to emailVerified=true`);
}

main().finally(() => prisma.$disconnect());
