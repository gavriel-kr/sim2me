/**
 * Seed script: 75 SEO articles from Part 7 (25 HE, 25 EN, 25 AR)
 * Reads from prisma/extracted-75-utf8.html (from sim2me_75_articles.docx via mammoth).
 * Parses HTML, extracts title/meta/body, injects CTA block, upserts to DB.
 * Run: npx tsx prisma/seed-articles-part7.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SITE = 'https://www.sim2me.net';

const SLUG_TO_DEST: Record<string, string> = {
  'esim-azerbaijan': 'az',
  'esim-bosnia': 'ba',
  'esim-kyrgyzstan': 'kg',
  'esim-fiji': 'fj',
  'esim-myanmar': 'mm',
  'esim-bangladesh': 'bd',
  'esim-uruguay': 'uy',
  'esim-paraguay': 'py',
  'esim-bolivia': 'bo',
  'esim-honduras': 'hn',
  'esim-nicaragua': 'ni',
  'esim-senegal': 'sn',
  'esim-ghana': 'gh',
  'esim-ivory-coast': 'ci',
  'esim-namibia': 'na',
  'esim-botswana': 'bw',
  'esim-ethiopia': 'et',
  'esim-uganda': 'ug',
  'esim-rwanda': 'rw',
  'esim-liechtenstein': 'li',
  'esim-kosovo': 'xk',
  'esim-faroe-islands': 'fo',
  'esim-french-polynesia': 'pf',
  'esim-new-caledonia': 'nc',
  'esim-mauritania': 'mr',
  'esim-belize': 'bz',
  'esim-tajikistan': 'tj',
  'esim-turkmenistan': 'tm',
  'esim-bhutan': 'bt',
  'esim-papua-new-guinea': 'pg',
  'esim-vanuatu': 'vu',
  'esim-tonga': 'to',
  'esim-samoa': 'ws',
  'esim-reunion': 're',
  'esim-cape-verde': 'cv',
  'esim-gambia': 'gm',
  'esim-sierra-leone': 'sl',
  'esim-liberia': 'lr',
  'esim-togo': 'tg',
  'esim-benin': 'bj',
  'esim-gabon': 'ga',
  'esim-congo': 'cg',
  'esim-malawi': 'mw',
  'esim-zambia': 'zm',
  'esim-zimbabwe': 'zw',
  'esim-guyana': 'gy',
  'esim-suriname': 'sr',
  'esim-barbados': 'bb',
  'esim-trinidad-tobago': 'tt',
  'esim-caribbean-islands': 'caribbean',
  'esim-bahamas': 'bs',
  'esim-solomon-islands': 'sb',
  'esim-micronesia': 'fm',
  'esim-kiribati': 'ki',
  'esim-palau': 'pw',
  'esim-marshall-islands': 'mh',
};

function getCtaHref(slug: string, locale: 'he' | 'en' | 'ar'): string {
  const code = SLUG_TO_DEST[slug];
  if (!code) return `${SITE}/destinations`;
  const prefix = locale === 'en' ? '/en' : `/${locale}`;
  return `${SITE}${prefix}/destinations/${code}`;
}

function getCtaButtonText(locale: 'he' | 'en' | 'ar'): string {
  return locale === 'he' ? '← תוכניות eSIM' : locale === 'ar' ? 'خطط eSIM ←' : 'eSIM plans →';
}

function buildCtaBlockHtml(ctaHref: string, locale: 'he' | 'en' | 'ar'): string {
  const dirAttr = locale === 'he' || locale === 'ar' ? ' dir="rtl"' : '';
  const heading = locale === 'he' ? 'לרכישת איסים – לחצו כאן' : locale === 'ar' ? 'للحصول على eSIM – اضغط هنا' : 'Ready to get your eSIM?';
  const buttonText = getCtaButtonText(locale);
  return `<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center"${dirAttr}><p class="text-xl font-bold text-emerald-900 mb-2">${heading}</p><a href="${ctaHref}" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">${buttonText}</a></div>`;
}

const SLUG_LOCALE: { slug: string; locale: 'he' | 'en' | 'ar' }[] = [
  { slug: 'esim-azerbaijan', locale: 'he' },
  { slug: 'esim-bosnia', locale: 'he' },
  { slug: 'esim-kyrgyzstan', locale: 'he' },
  { slug: 'esim-fiji', locale: 'he' },
  { slug: 'esim-myanmar', locale: 'he' },
  { slug: 'esim-bangladesh', locale: 'he' },
  { slug: 'esim-uruguay', locale: 'he' },
  { slug: 'esim-paraguay', locale: 'he' },
  { slug: 'esim-bolivia', locale: 'he' },
  { slug: 'esim-honduras', locale: 'he' },
  { slug: 'esim-nicaragua', locale: 'he' },
  { slug: 'esim-senegal', locale: 'he' },
  { slug: 'esim-ghana', locale: 'he' },
  { slug: 'esim-ivory-coast', locale: 'he' },
  { slug: 'esim-namibia', locale: 'he' },
  { slug: 'esim-botswana', locale: 'he' },
  { slug: 'esim-ethiopia', locale: 'he' },
  { slug: 'esim-uganda', locale: 'he' },
  { slug: 'esim-rwanda', locale: 'he' },
  { slug: 'esim-liechtenstein', locale: 'he' },
  { slug: 'esim-kosovo', locale: 'he' },
  { slug: 'esim-faroe-islands', locale: 'he' },
  { slug: 'esim-french-polynesia', locale: 'he' },
  { slug: 'esim-new-caledonia', locale: 'he' },
  { slug: 'esim-mauritania', locale: 'he' },
  { slug: 'esim-belize', locale: 'en' },
  { slug: 'esim-tajikistan', locale: 'en' },
  { slug: 'esim-turkmenistan', locale: 'en' },
  { slug: 'esim-bhutan', locale: 'en' },
  { slug: 'esim-papua-new-guinea', locale: 'en' },
  { slug: 'esim-vanuatu', locale: 'en' },
  { slug: 'esim-tonga', locale: 'en' },
  { slug: 'esim-samoa', locale: 'en' },
  { slug: 'esim-reunion', locale: 'en' },
  { slug: 'esim-cape-verde', locale: 'en' },
  { slug: 'esim-gambia', locale: 'en' },
  { slug: 'esim-sierra-leone', locale: 'en' },
  { slug: 'esim-liberia', locale: 'en' },
  { slug: 'esim-togo', locale: 'en' },
  { slug: 'esim-benin', locale: 'en' },
  { slug: 'esim-gabon', locale: 'en' },
  { slug: 'esim-congo', locale: 'en' },
  { slug: 'esim-malawi', locale: 'en' },
  { slug: 'esim-zambia', locale: 'en' },
  { slug: 'esim-zimbabwe', locale: 'en' },
  { slug: 'esim-guyana', locale: 'en' },
  { slug: 'esim-suriname', locale: 'en' },
  { slug: 'esim-barbados', locale: 'en' },
  { slug: 'esim-trinidad-tobago', locale: 'en' },
  { slug: 'esim-caribbean-islands', locale: 'en' },
  { slug: 'esim-bahamas', locale: 'ar' },
  { slug: 'esim-barbados', locale: 'ar' },
  { slug: 'esim-guyana', locale: 'ar' },
  { slug: 'esim-suriname', locale: 'ar' },
  { slug: 'esim-tajikistan', locale: 'ar' },
  { slug: 'esim-turkmenistan', locale: 'ar' },
  { slug: 'esim-bhutan', locale: 'ar' },
  { slug: 'esim-papua-new-guinea', locale: 'ar' },
  { slug: 'esim-fiji', locale: 'ar' },
  { slug: 'esim-vanuatu', locale: 'ar' },
  { slug: 'esim-solomon-islands', locale: 'ar' },
  { slug: 'esim-micronesia', locale: 'ar' },
  { slug: 'esim-kiribati', locale: 'ar' },
  { slug: 'esim-palau', locale: 'ar' },
  { slug: 'esim-marshall-islands', locale: 'ar' },
  { slug: 'esim-cape-verde', locale: 'ar' },
  { slug: 'esim-gambia', locale: 'ar' },
  { slug: 'esim-sierra-leone', locale: 'ar' },
  { slug: 'esim-liberia', locale: 'ar' },
  { slug: 'esim-togo', locale: 'ar' },
  { slug: 'esim-benin', locale: 'ar' },
  { slug: 'esim-gabon', locale: 'ar' },
  { slug: 'esim-malawi', locale: 'ar' },
  { slug: 'esim-zambia', locale: 'ar' },
  { slug: 'esim-zimbabwe', locale: 'ar' },
];

/** Parse extracted HTML: split by <h1><strong>, extract title, meta, body; strip CTA paragraphs */
function parsePart7Html(html: string): { title: string; metaDesc: string; bodyHtml: string }[] {
  const segments = html.split(/<h1><strong>/);
  const articles: { title: string; metaDesc: string; bodyHtml: string }[] = [];
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const titleMatch = seg.match(/^([^<]+)<\/strong><\/h1>/);
    const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').trim() : '';
    let rest = seg.replace(/^[^<]+<\/strong><\/h1>/, '');
    const metaMatch = rest.match(/<p><em>([\s\S]*?)<\/em><\/p>/);
    let metaDesc = '';
    if (metaMatch) {
      metaDesc = metaMatch[1]
        .replace(/^📋\s*Meta:\s*/i, '')
        .replace(/^.*?(?:وصف|Meta)[^:]*:\s*/i, '')
        .replace(/&amp;/g, '&')
        .trim();
      rest = rest.replace(/<p><em>[\s\S]*?<\/em><\/p>/, '');
    }
    rest = rest
      .replace(/<p><strong>🔗[\s\S]*?<\/strong><\/p>/gi, '')
      .replace(/<p><strong>✅[\s\S]*?<\/strong><\/p>/gi, '')
      .trim();
    articles.push({ title, metaDesc, bodyHtml: rest });
  }
  return articles;
}

async function main() {
  const htmlPath = path.join(__dirname, 'extracted-75-utf8.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('Missing extracted-75-utf8.html. Run: node prisma/extract-docx.js "path/to/sim2me_75_articles.docx"');
    process.exit(1);
  }
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const parsed = parsePart7Html(html);
  if (parsed.length !== 75) {
    console.error('Expected 75 articles, got', parsed.length);
    process.exit(1);
  }

  const baseOrder = 200;
  for (let i = 0; i < 75; i++) {
    const { slug, locale } = SLUG_LOCALE[i];
    const { title, metaDesc, bodyHtml } = parsed[i];
    const ctaHref = getCtaHref(slug, locale);
    const content = bodyHtml + '\n' + buildCtaBlockHtml(ctaHref, locale);
    const excerpt = metaDesc.slice(0, 160) + (metaDesc.length > 160 ? '…' : '');
    const articleOrder = baseOrder + i;

    await prisma.article.upsert({
      where: { slug_locale: { slug, locale } },
      create: {
        slug,
        locale,
        title,
        content,
        excerpt,
        metaTitle: title.slice(0, 60),
        metaDesc,
        articleOrder,
        status: 'PUBLISHED',
        showRelatedArticles: true,
      },
      update: {
        title,
        content,
        excerpt,
        metaTitle: title.slice(0, 60),
        metaDesc,
        articleOrder,
        status: 'PUBLISHED',
      },
    });
    console.log(`[${locale}] ${slug}: ${title.slice(0, 40)}…`);
  }
  console.log('Done. 75 part7 articles seeded.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
