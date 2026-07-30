import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const slug = process.argv[2] || 'esim-uruguay';
const a = await prisma.article.findUnique({
  where: { slug },
  select: { slug: true, titleHe: true, titleEn: true, titleAr: true, contentHe: true, contentEn: true, contentAr: true },
});
console.log(JSON.stringify(a, null, 2));
await prisma.$disconnect();
