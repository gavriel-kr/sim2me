import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const articles = await prisma.article.findMany({
  select: {
    slug: true,
    titleEn: true,
    titleHe: true,
    titleAr: true,
    statusEn: true,
    statusHe: true,
    statusAr: true,
  },
});
const arOnly = articles.filter(
  (a) =>
    a.statusAr !== 'PUBLISHED' &&
    !a.titleAr?.trim() &&
    a.statusEn === 'PUBLISHED' &&
    a.titleEn?.trim()
);
console.log('AR-only (EN published):', arOnly.length);
for (const a of arOnly) console.log(a.slug);
await prisma.$disconnect();
