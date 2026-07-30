import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const articles = await prisma.article.findMany();
const arOnly = articles.filter(
  (a) =>
    (a.statusAr !== 'PUBLISHED' || !a.titleAr?.trim()) &&
    a.statusEn === 'PUBLISHED' &&
    a.titleEn?.trim()
);

const dir = path.join(__dirname, 'ar-sources');
fs.mkdirSync(dir, { recursive: true });
for (const a of arOnly) {
  fs.writeFileSync(
    path.join(dir, `${a.slug}.json`),
    JSON.stringify({ titleEn: a.titleEn, contentEn: a.contentEn }, null, 2),
    'utf-8'
  );
}
console.log('Exported', arOnly.length, 'files to', dir);
await prisma.$disconnect();
