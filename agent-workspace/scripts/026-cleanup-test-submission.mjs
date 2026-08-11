/**
 * Removes the single contact submission created by the ticket 026 local verification run.
 *
 * Narrow on purpose: it matches only the throwaway address used for that test, so it cannot touch a
 * real customer's message.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const { count } = await prisma.contactSubmission.deleteMany({ where: { email: 'ref-test@example.com' } });
console.log(`deleted ${count} test submission(s)`);
await prisma.$disconnect();
