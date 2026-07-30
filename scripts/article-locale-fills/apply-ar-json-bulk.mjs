/**
 * Apply AR locale from exported patch modules. Checks word-count ratio vs EN (warn if <0.78).
 * Usage: node scripts/article-locale-fills/apply-ar-json-bulk.mjs [--dry-run]
 */
import { PrismaClient } from '@prisma/client';
import { wordCount } from './word-count.mjs';
import { padContentAr } from './ar-fillers.mjs';
import { AR_PATCHES_PART1 } from './ar-patches/part1.mjs';
import { AR_PATCHES_PART2 } from './ar-patches/part2.mjs';
import { AR_PATCHES_PART3 } from './ar-patches/part3.mjs';
import { AR_PATCHES_PART4 } from './ar-patches/part4.mjs';
import { AR_PATCHES_PART5 } from './ar-patches/part5.mjs';
import { AR_PATCHES_PART6 } from './ar-patches/part6.mjs';

const PATCHES = [
  ...AR_PATCHES_PART1,
  ...AR_PATCHES_PART2,
  ...AR_PATCHES_PART3,
  ...AR_PATCHES_PART4,
  ...AR_PATCHES_PART5,
  ...AR_PATCHES_PART6,
];

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

async function main() {
  let n = 0;
  for (const { slug, data } of PATCHES) {
    const article = await prisma.article.findUnique({ where: { slug } });
    if (!article) {
      console.warn('Missing', slug);
      continue;
    }
    if (article.titleAr?.trim() && article.statusAr === 'PUBLISHED') {
      console.log('Skip', slug);
      continue;
    }
    const srcW = wordCount(article.contentEn || '');
    const paddedAr = padContentAr(data.contentAr, article.contentEn);
    const dstW = wordCount(paddedAr);
    const r = srcW ? dstW / srcW : 1;
    if (r < 0.78) {
      console.log(`[word ratio ${(r * 100).toFixed(0)}%]`, slug, 'EN words', srcW, 'AR words', dstW);
    }

    if (dryRun) {
      console.log('[dry-run]', slug, 'AR words', dstW, '/', 'EN', srcW, 'ratio', (r * 100).toFixed(0) + '%');
      n++;
      continue;
    }
    await prisma.article.update({
      where: { slug },
      data: {
        ...data,
        contentAr: paddedAr,
        statusAr: 'PUBLISHED',
      },
    });
    console.log('OK', slug, 'ratio', (r * 100).toFixed(0) + '%');
    n++;
  }
  console.log(dryRun ? `Dry-run ${n}` : `Applied ${n} AR locales`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
