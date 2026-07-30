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

let enMissing = 0, heMissing = 0, arMissing = 0;

for (const a of missing) {
  if (a.statusEn !== 'PUBLISHED') enMissing++;
  if (a.statusHe !== 'PUBLISHED') heMissing++;
  if (a.statusAr !== 'PUBLISHED') arMissing++;
}

console.log(`סה"כ מאמרים: ${articles.length}`);
console.log(`מאמרים עם פערים: ${missing.length}`);
console.log(`EN חסר: ${enMissing} | HE חסר: ${heMissing} | AR חסר: ${arMissing}`);
console.log(`סה"כ תרגומים נדרשים: ${enMissing + heMissing + arMissing}`);
console.log('');
console.log('slug | EN | HE | AR | חסר');
console.log('-----|----|----|----|---------');

for (const a of missing) {
  const en = a.statusEn === 'PUBLISHED' ? '✅' : '❌';
  const he = a.statusHe === 'PUBLISHED' ? '✅' : '❌';
  const ar = a.statusAr === 'PUBLISHED' ? '✅' : '❌';
  const gaps = [];
  if (a.statusEn !== 'PUBLISHED') gaps.push('EN');
  if (a.statusHe !== 'PUBLISHED') gaps.push('HE');
  if (a.statusAr !== 'PUBLISHED') gaps.push('AR');
  console.log(`${a.slug} | ${en} | ${he} | ${ar} | ${gaps.join('+')}`);
}

await prisma.$disconnect();
