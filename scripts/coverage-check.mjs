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
  orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }]
});

const missing = articles.filter(a =>
  a.statusEn !== 'PUBLISHED' || a.statusHe !== 'PUBLISHED' || a.statusAr !== 'PUBLISHED'
);

console.log('TOTAL ARTICLES:', articles.length);
console.log('ARTICLES WITH GAPS:', missing.length);
console.log('');

for (const a of missing) {
  const gaps = [];
  if (a.statusEn !== 'PUBLISHED') gaps.push(`EN[${a.statusEn}|title:${a.titleEn ? 'yes' : 'EMPTY'}]`);
  if (a.statusHe !== 'PUBLISHED') gaps.push(`HE[${a.statusHe}|title:${a.titleHe ? 'yes' : 'EMPTY'}]`);
  if (a.statusAr !== 'PUBLISHED') gaps.push(`AR[${a.statusAr}|title:${a.titleAr ? 'yes' : 'EMPTY'}]`);
  console.log(`${a.slug} | ${gaps.join(', ')}`);
}

await prisma.$disconnect();
