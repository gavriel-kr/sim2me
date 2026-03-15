import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  // PRISMA_DATABASE_URL takes priority (Accelerate URL for serverless runtime).
  // Falls back to DATABASE_URL (direct connection, managed by Vercel integration).
  const url = process.env.PRISMA_DATABASE_URL ?? process.env.DATABASE_URL;
  return new PrismaClient({ datasources: { db: { url } } }).$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
