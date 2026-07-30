import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const rows = await prisma.article.findMany({
  where: { statusHe: 'PUBLISHED', titleHe: { not: '' } },
  select: { slug: true, contentHe: true },
});

const out = {};
for (const r of rows) {
  const ch = r.contentHe || '';
  if ((ch.match(/cta-block/g) || []).length < 2) continue;
  const m = ch.match(/cta-block[\s\S]*?<\/div>\s*<p>([\s\S]*?)<\/p>/);
  if (!m) continue;
  out[r.slug] = m[1].replace(/\s+/g, ' ').trim();
}

const outPath = path.join(__dirname, 'p4-he-extracted.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');
console.log('Wrote', Object.keys(out).length, 'entries to', outPath);
await prisma.$disconnect();
