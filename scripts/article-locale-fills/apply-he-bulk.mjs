/**
 * Fill Hebrew locale: special long articles + standard destination template.
 * Pads HE vs EN word ratio to ≥0.78 when English source exists.
 * Usage: node scripts/article-locale-fills/apply-he-bulk.mjs [--dry-run]
 */
import { PrismaClient } from '@prisma/client';
import { wordCount } from './word-count.mjs';
import { padContentHe } from './he-fillers.mjs';
import { getSpecialHe } from './he-special.mjs';
import { SLUG_TO_HE_NAME } from './slug-to-he-name.mjs';
import { destForSlug } from './slug-to-dest.mjs';
import { buildHeStandardDestinationHtml, buildSeoHe } from './he-country-template.mjs';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const articles = await prisma.article.findMany({
    orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
  });

  let n = 0;
  let skipped = 0;

  for (const article of articles) {
    if (article.statusHe === 'PUBLISHED' && article.titleHe?.trim()) {
      continue;
    }
    if (article.statusHe === 'PUBLISHED') {
      continue;
    }

    const slug = article.slug;
    const spec = getSpecialHe(slug);
    const countryHe = SLUG_TO_HE_NAME[slug];
    const dest = destForSlug(slug);

    let titleHe;
    let excerptPlain;
    let baseHtml;

    if (spec) {
      titleHe = spec.titleHe;
      excerptPlain = spec.excerptPlain;
      baseHtml = spec.contentHe;
    } else if (countryHe && dest) {
      titleHe = `eSIM ל${countryHe} — חיבור נוח עם Sim2Me`;
      excerptPlain = `מדריך קצר ל‑eSIM ב${countryHe}: הפעלה דיגיטלית, בלי להחליף כרטיס SIM, עם תמיכה וניהול בקשה מ‑Sim2Me.`;
      baseHtml = buildHeStandardDestinationHtml({ countryHe, dest });
    } else {
      console.warn('[skip-no-he-template]', slug);
      skipped++;
      continue;
    }

    const enW = wordCount(article.contentEn || '');
    const padded = padContentHe(baseHtml, article.contentEn || '');
    const r = enW ? wordCount(padded) / enW : 1;
    if (enW && r < 0.78) {
      console.log('[ratio]', slug, (r * 100).toFixed(0) + '%', 'HE', wordCount(padded), 'EN', enW);
    }

    const seo = buildSeoHe(titleHe, excerptPlain);

    if (dryRun) {
      console.log('[dry-run]', slug, 'HE words', wordCount(padded), 'EN', enW, 'ratio', enW ? (r * 100).toFixed(0) + '%' : 'n/a');
      n++;
      continue;
    }

    await prisma.article.update({
      where: { slug },
      data: {
        titleHe,
        contentHe: padded,
        statusHe: 'PUBLISHED',
        ...seo,
      },
    });
    console.log('OK', slug, enW ? `ratio ${(r * 100).toFixed(0)}%` : '');
    n++;
  }

  console.log(dryRun ? `Dry-run updated ${n} (skipped ${skipped})` : `Applied ${n} Hebrew locales (skipped ${skipped})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
