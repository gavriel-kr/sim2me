import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const r = await prisma.article.findUnique({
  where: { slug: 'esim-uruguay' },
  select: { contentHe: true },
});
const ch = r.contentHe;
const m = ch.match(/cta-block[\s\S]*?<\/div>\s*<p>([\s\S]*?)<\/p>/);
console.log('P4:', m && m[1]);
await prisma.$disconnect();
