/**
 * Apply short-template EN/AR content to articles. Safe: skips locale if title already set.
 * Usage: node scripts/article-locale-fills/apply-short-template.mjs [--dry-run]
 */
import { PrismaClient } from '@prisma/client';
import { SHORT_TEMPLATE_DATA } from './short-template-data.mjs';
import { buildShortTemplateHtml, buildSeo } from './short-template-builder.mjs';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

function excerptPlainEn(countryEn) {
  return `When you land in ${countryEn}, your phone becomes an essential tool: navigation, booking rides, check-in, and sharing your location. Roaming from home can get expensive fast — an eSIM keeps data predictable.`;
}

function excerptPlainAr(countryAr) {
  return `عند وصولك إلى ${countryAr}، يصبح الهاتف أداة أساسية للتنقل والحجز ومشاركة الموقع. التجوال من البلد الأصلي قد يكون مكلفًا — eSIM يمنحك بيانات أوضح.`;
}

async function main() {
  let updated = 0;
  let skipped = 0;

  for (const slug of Object.keys(SHORT_TEMPLATE_DATA)) {
    const data = SHORT_TEMPLATE_DATA[slug];
    const article = await prisma.article.findUnique({ where: { slug } });
    if (!article) {
      console.warn('Missing article row:', slug);
      continue;
    }

    for (const locale of ['en', 'ar']) {
      const titleKey = locale === 'en' ? 'titleEn' : 'titleAr';
      const statusKey = locale === 'en' ? 'statusEn' : 'statusAr';
      if (article[titleKey]?.trim()) {
        skipped++;
        continue;
      }

      const html = buildShortTemplateHtml(locale, data);
      const title = locale === 'en' ? data.titleEn : data.titleAr;
      const plain = locale === 'en' ? excerptPlainEn(data.countryEn) : excerptPlainAr(data.countryAr);
      const seo = buildSeo(locale, title, plain);

      const patch =
        locale === 'en'
          ? {
              titleEn: title,
              contentEn: html,
              excerptEn: seo.excerpt,
              focusKeywordEn: seo.focusKeyword,
              metaTitleEn: seo.metaTitle,
              metaDescEn: seo.metaDesc,
              ogTitleEn: seo.ogTitle,
              ogDescEn: seo.ogDesc,
              statusEn: 'PUBLISHED',
            }
          : {
              titleAr: title,
              contentAr: html,
              excerptAr: seo.excerpt,
              focusKeywordAr: seo.focusKeyword,
              metaTitleAr: seo.metaTitle,
              metaDescAr: seo.metaDesc,
              ogTitleAr: seo.ogTitle,
              ogDescAr: seo.ogDesc,
              statusAr: 'PUBLISHED',
            };

      if (dryRun) {
        console.log('[dry-run] would update', slug, locale, title.slice(0, 40));
        updated++;
        continue;
      }

      await prisma.article.update({
        where: { slug },
        data: patch,
      });
      console.log('Updated', slug, locale);
      updated++;
    }
  }

  console.log(dryRun ? `Dry-run complete. ${updated} locale updates would apply, ${skipped} skipped.` : `Done. ${updated} locale rows updated, ${skipped} skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
