/**
 * Ticket 026 — find live article content that still promises support hours.
 *
 * Read-only. The message files and components were cleaned in 026, but the article corpus is seeded
 * into the database and rendered by the articles pages, so a claim there is just as public. The
 * model keeps one column per language, so each is scanned separately.
 *
 *   node agent-workspace/scripts/026-article-claims-check.mjs
 */
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();
const prisma = new PrismaClient();

const CLAIMS = [
  { name: '24/7', re: /24\s*\/\s*7/ },
  { name: 'around the clock', re: /around the clock/i },
  { name: 'response-time promise', re: /within (a few|\d+) hours|תוך (מספר )?שעות|خلال ساعات/ },
];

const articles = await prisma.article.findMany({
  select: {
    slug: true,
    statusEn: true, statusHe: true, statusAr: true,
    titleEn: true, titleHe: true, titleAr: true,
    contentEn: true, contentHe: true, contentAr: true,
    excerptEn: true, excerptHe: true, excerptAr: true,
  },
});

const showContext = process.argv.includes('--show');

let hits = 0;
for (const a of articles) {
  for (const loc of ['En', 'He', 'Ar']) {
    const body = `${a['title' + loc] ?? ''}\n${a['excerpt' + loc] ?? ''}\n${a['content' + loc] ?? ''}`;
    const found = CLAIMS.filter((c) => c.re.test(body)).map((c) => c.name);
    if (found.length) {
      hits++;
      console.log(`${String(a['status' + loc]).padEnd(10)} ${loc.toLowerCase()}  ${a.slug}  →  ${found.join(', ')}`);
      if (showContext) {
        for (const c of CLAIMS) {
          const m = body.match(new RegExp(`.{0,120}${c.re.source}.{0,120}`, c.re.flags.replace('g', '')));
          if (m) console.log(`           … ${m[0].replace(/\s+/g, ' ').trim()}`);
        }
      }
    }
  }
}

console.log(`\n${articles.length} articles scanned, ${hits} localized bodies with a support claim.`);
await prisma.$disconnect();
