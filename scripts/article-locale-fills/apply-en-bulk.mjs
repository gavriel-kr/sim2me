/**
 * Fill English locale from Hebrew template + pad vs Hebrew word count.
 * Usage: node scripts/article-locale-fills/apply-en-bulk.mjs [--dry-run]
 */
import { PrismaClient } from '@prisma/client';
import { wordCount } from './word-count.mjs';
import { padContentEn } from './en-fillers.mjs';
import { SLUG_TO_EN_NAME } from './slug-to-en-name.mjs';
import { destForSlug } from './slug-to-dest.mjs';
import { buildEnStandardDestinationHtml, buildSeoEn } from './en-country-template.mjs';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const articles = await prisma.article.findMany({
    orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
  });

  let n = 0;
  let skipped = 0;

  for (const article of articles) {
    if (article.statusEn === 'PUBLISHED' && article.titleEn?.trim()) {
      continue;
    }
    if (article.statusEn === 'PUBLISHED') {
      continue;
    }

    const slug = article.slug;
    const countryEn = SLUG_TO_EN_NAME[slug];
    const dest = destForSlug(slug);

    if (!countryEn || !dest) {
      console.log('[skip]', slug);
      skipped++;
      continue;
    }

    const titleEn = `eSIM for ${countryEn} — Stay connected with Sim2Me`;
    const excerptPlain = `Short guide to eSIM in ${countryEn}: digital activation, no plastic SIM swap, plans and support with Sim2Me.`;
    const baseHtml = buildEnStandardDestinationHtml({ countryEn, dest });
    const heW = wordCount(article.contentHe || '');
    const padded = padContentEn(baseHtml, article.contentHe || '');
    const r = heW ? wordCount(padded) / heW : 1;
    if (heW && r < 0.78) {
      console.log('[ratio]', slug, (r * 100).toFixed(0) + '%');
    }

    const seo = buildSeoEn(titleEn, excerptPlain);

    if (dryRun) {
      console.log('[dry-run]', slug, 'EN words', wordCount(padded), 'HE', heW, heW ? (r * 100).toFixed(0) + '%' : 'n/a');
      n++;
      continue;
    }

    await prisma.article.update({
      where: { slug },
      data: {
        titleEn,
        contentEn: padded,
        statusEn: 'PUBLISHED',
        ...seo,
      },
    });
    console.log('OK', slug, heW ? `ratio ${(r * 100).toFixed(0)}%` : '');
    n++;
  }

  console.log(dryRun ? `Dry-run ${n} (skipped ${skipped})` : `Applied ${n} English locales (skipped ${skipped})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
