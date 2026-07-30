/**
 * Print local article URLs for smoke testing (default port 3000).
 * Usage: node scripts/article-locale-fills/dump-local-article-urls.mjs [port]
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.argv[2] || '3000';
const base = `http://localhost:${port}`;
const prisma = new PrismaClient();

const articles = await prisma.article.findMany({
  select: { slug: true },
  orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
});

const lines = [
  '# Local article URLs — open after: npm run dev',
  `# Base: ${base}`,
  '',
  '## Index (lists + filters)',
  `${base}/en/articles`,
  `${base}/he/articles`,
  `${base}/ar/articles`,
  '',
  '## Every article × 3 locales',
];

for (const { slug } of articles) {
  for (const loc of ['en', 'he', 'ar']) {
    lines.push(`${base}/${loc}/articles/${slug}`);
  }
}

const out = path.join(__dirname, 'LOCAL-ARTICLE-URLS.txt');
fs.writeFileSync(out, lines.join('\n'), 'utf-8');
console.log('Wrote', lines.length - 8, 'article URLs (+ 3 index lines header) to', out);
await prisma.$disconnect();
