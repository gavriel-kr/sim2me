/**
 * Ticket 036 follow-up — find published article copy that contradicts the corrected FAQ.
 *
 * Read-only. Two claims the FAQ now retracts: that top-ups can be bought, and that an eSIM is valid
 * 180 days before activation.
 *
 *   node agent-workspace/scripts/036-article-facts-check.mjs
 */
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();
const prisma = new PrismaClient();

const CLAIMS = [
  { name: '180 days before activation', re: /180\s*(days|יום|يوم)/ },
  { name: 'top-up is available', re: /top[- ]?up|טעינה|إعادة الشحن/i },
];

const articles = await prisma.article.findMany({
  select: {
    slug: true,
    statusEn: true, statusHe: true, statusAr: true,
    contentEn: true, contentHe: true, contentAr: true,
  },
});

const rows = [];
for (const a of articles) {
  for (const loc of ['En', 'He', 'Ar']) {
    if (a['status' + loc] !== 'PUBLISHED') continue;
    const found = CLAIMS.filter((c) => c.re.test(a['content' + loc] ?? '')).map((c) => c.name);
    if (found.length) rows.push(`${loc.toLowerCase()}  ${a.slug}  →  ${found.join(', ')}`);
  }
}

rows.sort().forEach((r) => console.log(r));
console.log(`\n${articles.length} articles scanned, ${rows.length} published bodies contradict the FAQ.`);
await prisma.$disconnect();
