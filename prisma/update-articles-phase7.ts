/**
 * Update 75 Phase 7 articles from HTML files (HE + EN/AR).
 * - HE: prisma/content-phase7-update-he.html (25 articles, <article id="h1">..id="h25">)
 * - EN+AR: prisma/content-phase7-update-en-ar.html (25 EN then 25 AR, <article class="card" id="...">)
 * Replaces all href="https://www.sim2me.net/" with destination URL per slug+locale.
 * Run: npx tsx prisma/update-articles-phase7.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const SITE = 'https://www.sim2me.net';

const SLUG_TO_DEST: Record<string, string> = {
  'esim-azerbaijan': 'az', 'esim-bosnia': 'ba', 'esim-kyrgyzstan': 'kg', 'esim-fiji': 'fj',
  'esim-myanmar': 'mm', 'esim-bangladesh': 'bd', 'esim-uruguay': 'uy', 'esim-paraguay': 'py',
  'esim-bolivia': 'bo', 'esim-honduras': 'hn', 'esim-nicaragua': 'ni', 'esim-senegal': 'sn',
  'esim-ghana': 'gh', 'esim-ivory-coast': 'ci', 'esim-namibia': 'na', 'esim-botswana': 'bw',
  'esim-ethiopia': 'et', 'esim-uganda': 'ug', 'esim-rwanda': 'rw', 'esim-liechtenstein': 'li',
  'esim-kosovo': 'xk', 'esim-faroe-islands': 'fo', 'esim-french-polynesia': 'pf',
  'esim-new-caledonia': 'nc', 'esim-mauritania': 'mr', 'esim-belize': 'bz', 'esim-tajikistan': 'tj',
  'esim-turkmenistan': 'tm', 'esim-bhutan': 'bt', 'esim-papua-new-guinea': 'pg', 'esim-vanuatu': 'vu',
  'esim-tonga': 'to', 'esim-samoa': 'ws', 'esim-reunion': 're', 'esim-cape-verde': 'cv',
  'esim-gambia': 'gm', 'esim-sierra-leone': 'sl', 'esim-liberia': 'lr', 'esim-togo': 'tg',
  'esim-benin': 'bj', 'esim-gabon': 'ga', 'esim-congo': 'cg', 'esim-malawi': 'mw',
  'esim-zambia': 'zm', 'esim-zimbabwe': 'zw', 'esim-guyana': 'gy', 'esim-suriname': 'sr',
  'esim-barbados': 'bb', 'esim-trinidad-tobago': 'tt', 'esim-caribbean-islands': 'caribbean',
  'esim-bahamas': 'bs', 'esim-solomon-islands': 'sb', 'esim-micronesia': 'fm', 'esim-kiribati': 'ki',
  'esim-palau': 'pw', 'esim-marshall-islands': 'mh',
};

const SLUG_LOCALE: { slug: string; locale: 'he' | 'en' | 'ar' }[] = [
  { slug: 'esim-azerbaijan', locale: 'he' }, { slug: 'esim-bosnia', locale: 'he' }, { slug: 'esim-kyrgyzstan', locale: 'he' },
  { slug: 'esim-fiji', locale: 'he' }, { slug: 'esim-myanmar', locale: 'he' }, { slug: 'esim-bangladesh', locale: 'he' },
  { slug: 'esim-uruguay', locale: 'he' }, { slug: 'esim-paraguay', locale: 'he' }, { slug: 'esim-bolivia', locale: 'he' },
  { slug: 'esim-honduras', locale: 'he' }, { slug: 'esim-nicaragua', locale: 'he' }, { slug: 'esim-senegal', locale: 'he' },
  { slug: 'esim-ghana', locale: 'he' }, { slug: 'esim-ivory-coast', locale: 'he' }, { slug: 'esim-namibia', locale: 'he' },
  { slug: 'esim-botswana', locale: 'he' }, { slug: 'esim-ethiopia', locale: 'he' }, { slug: 'esim-uganda', locale: 'he' },
  { slug: 'esim-rwanda', locale: 'he' }, { slug: 'esim-liechtenstein', locale: 'he' }, { slug: 'esim-kosovo', locale: 'he' },
  { slug: 'esim-faroe-islands', locale: 'he' }, { slug: 'esim-french-polynesia', locale: 'he' }, { slug: 'esim-new-caledonia', locale: 'he' },
  { slug: 'esim-mauritania', locale: 'he' },
  { slug: 'esim-belize', locale: 'en' }, { slug: 'esim-tajikistan', locale: 'en' }, { slug: 'esim-turkmenistan', locale: 'en' },
  { slug: 'esim-bhutan', locale: 'en' }, { slug: 'esim-papua-new-guinea', locale: 'en' }, { slug: 'esim-vanuatu', locale: 'en' },
  { slug: 'esim-tonga', locale: 'en' }, { slug: 'esim-samoa', locale: 'en' }, { slug: 'esim-reunion', locale: 'en' },
  { slug: 'esim-cape-verde', locale: 'en' }, { slug: 'esim-gambia', locale: 'en' }, { slug: 'esim-sierra-leone', locale: 'en' },
  { slug: 'esim-liberia', locale: 'en' }, { slug: 'esim-togo', locale: 'en' }, { slug: 'esim-benin', locale: 'en' },
  { slug: 'esim-gabon', locale: 'en' }, { slug: 'esim-congo', locale: 'en' }, { slug: 'esim-malawi', locale: 'en' },
  { slug: 'esim-zambia', locale: 'en' }, { slug: 'esim-zimbabwe', locale: 'en' }, { slug: 'esim-guyana', locale: 'en' },
  { slug: 'esim-suriname', locale: 'en' }, { slug: 'esim-barbados', locale: 'en' }, { slug: 'esim-trinidad-tobago', locale: 'en' },
  { slug: 'esim-caribbean-islands', locale: 'en' },
  { slug: 'esim-bahamas', locale: 'ar' }, { slug: 'esim-barbados', locale: 'ar' }, { slug: 'esim-guyana', locale: 'ar' },
  { slug: 'esim-suriname', locale: 'ar' }, { slug: 'esim-tajikistan', locale: 'ar' }, { slug: 'esim-turkmenistan', locale: 'ar' },
  { slug: 'esim-bhutan', locale: 'ar' }, { slug: 'esim-papua-new-guinea', locale: 'ar' }, { slug: 'esim-fiji', locale: 'ar' },
  { slug: 'esim-vanuatu', locale: 'ar' }, { slug: 'esim-solomon-islands', locale: 'ar' }, { slug: 'esim-micronesia', locale: 'ar' },
  { slug: 'esim-kiribati', locale: 'ar' }, { slug: 'esim-palau', locale: 'ar' }, { slug: 'esim-marshall-islands', locale: 'ar' },
  { slug: 'esim-cape-verde', locale: 'ar' }, { slug: 'esim-gambia', locale: 'ar' }, { slug: 'esim-sierra-leone', locale: 'ar' },
  { slug: 'esim-liberia', locale: 'ar' }, { slug: 'esim-togo', locale: 'ar' }, { slug: 'esim-benin', locale: 'ar' },
  { slug: 'esim-gabon', locale: 'ar' }, { slug: 'esim-malawi', locale: 'ar' }, { slug: 'esim-zambia', locale: 'ar' },
  { slug: 'esim-zimbabwe', locale: 'ar' },
];

function getCtaHref(slug: string, locale: 'he' | 'en' | 'ar'): string {
  const code = SLUG_TO_DEST[slug];
  if (!code) return `${SITE}/destinations`;
  const prefix = locale === 'en' ? '/en' : `/${locale}`;
  return `${SITE}${prefix}/destinations/${code}`;
}

function replaceCtaLinks(html: string, ctaHref: string): string {
  return html
    .replace(/href=["']https:\/\/www\.sim2me\.net\/?["']/gi, `href="${ctaHref}"`)
    .replace(/href=["']https:\/\/www\.sim2me\.net\s*["']/gi, `href="${ctaHref}"`);
}

/** Parse Hebrew HTML: <article id="h1">..<article id="h25"> */
function parseHeHtml(html: string): { title: string; metaDesc: string; content: string }[] {
  const out: { title: string; metaDesc: string; content: string }[] = [];
  const re = /<article\s+id="h(\d+)"[^>]*>([\s\S]*?)<\/article>/gi;
  let m: RegExpExecArray | null;
  const byIndex: Record<number, string> = {};
  while ((m = re.exec(html)) !== null) {
    const i = parseInt(m[1], 10);
    if (i >= 1 && i <= 25) byIndex[i] = m[2];
  }
  for (let i = 1; i <= 25; i++) {
    const inner = byIndex[i] || '';
    const titleMatch = inner.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim() : '';
    const metaMatch = inner.match(/<p\s+class="meta"[^>]*>\s*<b>Meta Description:<\/b>\s*([\s\S]*?)<\/p>/);
    const metaDesc = metaMatch ? metaMatch[1].replace(/&amp;/g, '&').trim() : '';
    const content = inner.trim();
    out.push({ title, metaDesc, content });
  }
  return out;
}

/** Parse EN+AR HTML: first 25 <article class="card" id="..."> are EN, next 25 are AR */
function parseEnArHtml(html: string): { title: string; metaDesc: string; content: string }[] {
  const out: { title: string; metaDesc: string; content: string }[] = [];
  const re = /<article\s+class="card"\s+id="[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  let m: RegExpExecArray | null;
  const inners: string[] = [];
  while ((m = re.exec(html)) !== null) inners.push(m[1]);
  for (const inner of inners) {
    const titleMatch = inner.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim() : '';
    const metaMatch = inner.match(/<p\s+class="meta"[^>]*>\s*<b>Meta Description:<\/b>\s*([\s\S]*?)<\/p>/i);
    const metaDesc = metaMatch ? metaMatch[1].replace(/&amp;/g, '&').trim() : '';
    const content = inner.trim();
    out.push({ title, metaDesc, content });
  }
  return out;
}

async function main() {
  const dir = __dirname;
  const hePath = path.join(dir, 'content-phase7-update-he.html');
  const enArPath = path.join(dir, 'content-phase7-update-en-ar.html');

  if (!fs.existsSync(enArPath)) {
    console.error('Missing EN+AR file:', enArPath);
    process.exit(1);
  }

  let heArticles: { title: string; metaDesc: string; content: string }[] = [];
  if (fs.existsSync(hePath)) {
    const heHtml = fs.readFileSync(hePath, 'utf-8');
    heArticles = parseHeHtml(heHtml);
    if (heArticles.length !== 25) {
      console.error('Expected 25 Hebrew articles, got', heArticles.length);
      process.exit(1);
    }
  } else {
    console.warn('Hebrew file not found:', hePath);
    console.warn('Saving the pasted Hebrew HTML to that path and re-running will update all 75 articles.');
  }

  const enArHtml = fs.readFileSync(enArPath, 'utf-8');
  const enArArticles = parseEnArHtml(enArHtml);
  if (enArArticles.length !== 50) {
    console.error('Expected 50 EN+AR articles, got', enArArticles.length);
    process.exit(1);
  }

  const enArticles = enArArticles.slice(0, 25);
  const arArticles = enArArticles.slice(25, 50);
  const allParsed = [...heArticles, ...enArticles, ...arArticles];
  const total = allParsed.length;
  if (total === 0) {
    console.error('No articles to update. Add Hebrew file to update all 75.');
    process.exit(1);
  }

  const baseOrder = 200;
  const startIdx = heArticles.length === 25 ? 0 : 25; // if no HE, update only EN+AR (indices 25-74)
  const endIdx = 75;
  for (let i = startIdx; i < endIdx; i++) {
    const { slug, locale } = SLUG_LOCALE[i];
    const parsedIdx = heArticles.length === 25 ? i : i - 25;
    const { title, metaDesc, content } = allParsed[parsedIdx];
    const ctaHref = getCtaHref(slug, locale);
    const contentWithCta = replaceCtaLinks(content, ctaHref);
    const excerpt = metaDesc.slice(0, 160) + (metaDesc.length > 160 ? '…' : '');
    const articleOrder = baseOrder + i;

    await prisma.article.upsert({
      where: { slug_locale: { slug, locale } },
      create: {
        slug,
        locale,
        title,
        content: contentWithCta,
        excerpt,
        metaTitle: title.slice(0, 60),
        metaDesc,
        articleOrder,
        status: 'PUBLISHED',
        showRelatedArticles: true,
      },
      update: {
        title,
        content: contentWithCta,
        excerpt,
        metaTitle: title.slice(0, 60),
        metaDesc,
        articleOrder,
        status: 'PUBLISHED',
      },
    });
    console.log(`[${locale}] ${slug}: ${title.slice(0, 45)}…`);
  }
  console.log(`Done. ${endIdx - startIdx} Phase 7 articles updated.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
