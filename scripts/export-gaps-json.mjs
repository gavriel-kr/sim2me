import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { wordCount } from './article-locale-fills/word-count.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const articles = await prisma.article.findMany({
  orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
});

const gaps = [];
for (const a of articles) {
  const needEn = a.statusEn !== 'PUBLISHED' || !a.titleEn?.trim();
  const needHe = a.statusHe !== 'PUBLISHED' || !a.titleHe?.trim();
  const needAr = a.statusAr !== 'PUBLISHED' || !a.titleAr?.trim();
  if (!needEn && !needHe && !needAr) continue;

  let source = 'en';
  let sourceContent = a.contentEn;
  let sourceTitle = a.titleEn;
  if (needEn && a.titleHe?.trim()) {
    source = 'he';
    sourceContent = a.contentHe;
    sourceTitle = a.titleHe;
  } else if (needHe && a.titleEn?.trim()) {
    source = 'en';
    sourceContent = a.contentEn;
    sourceTitle = a.titleEn;
  } else if (needAr && a.titleEn?.trim()) {
    source = 'en';
    sourceContent = a.contentEn;
    sourceTitle = a.titleEn;
  }

  gaps.push({
    slug: a.slug,
    needEn,
    needHe,
    needAr,
    sourceLocale: source,
    sourceWords: wordCount(sourceContent || ''),
    titlePreview: (sourceTitle || '').slice(0, 60),
  });
}

const out = path.join(__dirname, 'article-locale-fills', 'gaps-export.json');
fs.writeFileSync(out, JSON.stringify(gaps, null, 2), 'utf-8');
console.log('Wrote', gaps.length, 'rows to', out);
await prisma.$disconnect();
