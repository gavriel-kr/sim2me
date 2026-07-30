import { PrismaClient } from '@prisma/client';
import { wordCount } from './word-count.mjs';

const prisma = new PrismaClient();
const articles = await prisma.article.findMany();
const arOnly = articles.filter(
  (a) =>
    (a.statusAr !== 'PUBLISHED' || !a.titleAr?.trim()) &&
    a.statusEn === 'PUBLISHED' &&
    a.titleEn?.trim()
);
arOnly.sort((a, b) => wordCount(a.contentEn) - wordCount(b.contentEn));
for (const a of arOnly) {
  console.log(wordCount(a.contentEn), a.slug, (a.titleEn || '').slice(0, 50));
}
console.log('TOTAL', arOnly.length);
await prisma.$disconnect();
