/**
 * Lists articles whose Hebrew body matches the short "למה Sim2Me" template (2 CTAs).
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const rows = await prisma.article.findMany({
  select: { slug: true, contentHe: true },
  where: { contentHe: { contains: 'למה Sim2Me' } },
});
const standard = rows.filter((r) => (r.contentHe.match(/cta-block/g) || []).length >= 2);
console.log('Short-template candidates:', standard.length);
for (const r of standard) console.log(r.slug);
await prisma.$disconnect();
