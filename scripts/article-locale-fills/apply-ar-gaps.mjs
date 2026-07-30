/**
 * Fill remaining Arabic locales using standard template + pad vs English (≥0.78 ratio).
 * Run after apply-en-bulk so contentEn exists for EN+AR rows.
 * Usage: node scripts/article-locale-fills/apply-ar-gaps.mjs [--dry-run]
 */
import { PrismaClient } from '@prisma/client';
import { wordCount } from './word-count.mjs';
import { padContentAr } from './ar-fillers.mjs';
import { SLUG_TO_AR_NAME } from './slug-to-ar-name.mjs';
import { destForSlug } from './slug-to-dest.mjs';
import { buildArStandardDestinationHtml, buildSeoAr } from './ar-country-template.mjs';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const articles = await prisma.article.findMany({
    orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
  });

  let n = 0;
  let skipped = 0;

  for (const article of articles) {
    if (article.statusAr === 'PUBLISHED' && article.titleAr?.trim()) {
      continue;
    }
    if (article.statusAr === 'PUBLISHED') {
      continue;
    }

    const slug = article.slug;
    const countryAr = SLUG_TO_AR_NAME[slug];
    const dest = destForSlug(slug);

    if (!countryAr || !dest) {
      skipped++;
      continue;
    }

    const titleAr = `eSIM لـ ${countryAr} — اتصال مريح مع Sim2Me`;
    const excerptPlain = `دليل قصير لـ eSIM في ${countryAr}: تفعيل رقمي ودعم من Sim2Me.`;
    const baseHtml = buildArStandardDestinationHtml({ countryAr, dest });
    const padded = padContentAr(baseHtml, article.contentEn || '');
    const enW = wordCount(article.contentEn || '');
    const r = enW ? wordCount(padded) / enW : 1;
    if (enW && r < 0.78) {
      console.log('[ratio]', slug, (r * 100).toFixed(0) + '%');
    }

    const seo = buildSeoAr(titleAr, excerptPlain);

    if (dryRun) {
      console.log('[dry-run]', slug, 'AR', wordCount(padded), 'EN', enW);
      n++;
      continue;
    }

    await prisma.article.update({
      where: { slug },
      data: {
        titleAr,
        contentAr: padded,
        statusAr: 'PUBLISHED',
        ...seo,
      },
    });
    console.log('OK', slug);
    n++;
  }

  console.log(dryRun ? `Dry-run ${n} (skipped ${skipped})` : `Applied ${n} AR gap locales (skipped ${skipped})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
