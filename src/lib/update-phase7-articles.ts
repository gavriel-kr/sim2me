/**
 * Shared logic for updating 75 Phase 7 articles. Used by:
 * - prisma/update-articles-phase7.ts (CLI)
 * - API POST /api/admin/update-phase7-articles (production)
 */
import type { PrismaClient } from '@prisma/client';

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

/** Derive only the destination name (before colon/dash), not the full title. e.g. "איסים לגיאורגיה: הישארו..." -> "גיאורגיה" */
function getDestinationFromTitle(title: string, locale: 'he' | 'en' | 'ar'): string {
  let rest = '';
  if (locale === 'he') rest = title.replace(/^איסים ל/, '').trim();
  else if (locale === 'en') rest = title.replace(/^eSIM for /i, '').trim();
  else if (locale === 'ar') rest = title.replace(/^eSIM\s+/, '').trim();
  else return '';
  return rest.split(/[:\-–—]/)[0].trim();
}

/**
 * Canonical CTA block for all articles, all languages.
 * Text line: "לרכישת איסים ל(יעד) – לחצו כאן" (HE) / equivalent in EN/AR.
 * Button: "לרכישת איסים ל(יעד)" (HE) / equivalent in EN/AR.
 */
function buildCtaBlockHtml(ctaHref: string, locale: 'he' | 'en' | 'ar', destination?: string): string {
  const dirAttr = locale === 'he' || locale === 'ar' ? ' dir="rtl"' : '';
  const heading =
    destination !== undefined && destination !== ''
      ? locale === 'he'
        ? `לרכישת איסים ל${destination} – לחצו כאן`
        : locale === 'ar'
          ? `لشراء eSIM لـ ${destination} – اضغط هنا`
          : `Get eSIM for ${destination} – Click here`
      : locale === 'he'
        ? 'לרכישת איסים – לחצו כאן'
        : locale === 'ar'
          ? 'لشراء eSIM – اضغط هنا'
          : 'Get eSIM – Click here';
  const buttonText =
    destination !== undefined && destination !== ''
      ? locale === 'he'
        ? `לרכישת איסים ל${destination}`
        : locale === 'ar'
          ? `لشراء eSIM لـ ${destination}`
          : `Get eSIM for ${destination}`
      : locale === 'he'
        ? 'לרכישת איסים'
        : locale === 'ar'
          ? 'لشراء eSIM'
          : 'Get eSIM';
  const headingLinkClass = 'text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded';
  return `<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center"${dirAttr}><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${ctaHref}" class="${headingLinkClass}">${heading}</a></p><a href="${ctaHref}" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">${buttonText}</a></div>`;
}

/**
 * Normalize plain-format content: remove Meta Description from body, replace CTA #1/#2 with canonical cta-block.
 * Supports: HE <p><strong>CTA #1:</strong>; EN/AR <div class='cta'><strong>CTA #1 (mid-article):</strong> and CTA #2 (final):.
 * Removes duplicate leading <h1> if it matches the article title.
 */
function normalizePhase7Content(html: string, ctaHref: string, locale: 'he' | 'en' | 'ar', title: string): string {
  const destination = getDestinationFromTitle(title, locale);
  const ctaBlock = buildCtaBlockHtml(ctaHref, locale, destination);
  let out = html;
  // Remove Meta Description (HE: <p><strong>; EN/AR: <p class="meta"><b>)
  out = out.replace(/<p[^>]*>\s*<strong>Meta Description:<\/strong>[\s\S]*?<\/p>\s*/i, '');
  out = out.replace(/<p\s+class="meta"[^>]*>\s*<b>Meta Description:<\/b>[\s\S]*?<\/p>\s*/i, '');
  // Hebrew: CTA in <p>
  out = out.replace(/<p[^>]*>\s*<strong>CTA #1:<\/strong>[\s\S]*?<\/p>/i, ctaBlock);
  out = out.replace(/<p[^>]*>\s*<strong>CTA #2:<\/strong>[\s\S]*?<\/p>/i, ctaBlock);
  // EN: CTA in <div class='cta'>
  out = out.replace(/<div\s+class=['"]cta['"][^>]*>\s*<strong>CTA #1 \(mid-article\):<\/strong>[\s\S]*?<\/div>/gi, ctaBlock);
  out = out.replace(/<div\s+class=['"]cta['"][^>]*>\s*<strong>CTA #2 \(final\):<\/strong>[\s\S]*?<\/div>/gi, ctaBlock);
  // AR: CTA in <div class='cta'> with Arabic labels (في منتصف المقال / ختاماً)
  out = out.replace(/<div\s+class=['"]cta['"][^>]*>\s*<strong>CTA #1 \(في منتصف المقال\):<\/strong>[\s\S]*?<\/div>/gi, ctaBlock);
  out = out.replace(/<div\s+class=['"]cta['"][^>]*>\s*<strong>CTA #2 \(ختاماً\):<\/strong>[\s\S]*?<\/div>/gi, ctaBlock);
  // Remove duplicate title: leading <h1> that matches article title (avoid showing title twice on page)
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  out = out.replace(new RegExp(`^\\s*<h1[^>]*>\\s*${escapedTitle}\\s*<\\/h1>\\s*`, 'i'), '');
  return out;
}

function decodeHtml(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").trim();
}

/** Parse Hebrew "plain" HTML: <article dir="rtl"> with first <p><strong>Meta Description:</strong>...</p> */
function parseHeHtmlPlain(html: string): { title: string; metaDesc: string; content: string }[] {
  const out: { title: string; metaDesc: string; content: string }[] = [];
  const re = /<article[^>]*>([\s\S]*?)<\/article>/gi;
  let m: RegExpExecArray | null;
  const inners: string[] = [];
  while ((m = re.exec(html)) !== null) inners.push(m[1]);
  for (const inner of inners.slice(0, 25)) {
    const titleMatch = inner.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const title = titleMatch ? decodeHtml(titleMatch[1].replace(/<[^>]+>/g, '')) : '';
    const metaMatch = inner.match(/<p[^>]*>\s*<strong>Meta Description:<\/strong>\s*([\s\S]*?)<\/p>/i);
    const metaDesc = metaMatch ? decodeHtml(metaMatch[1].replace(/<[^>]+>/g, '')) : '';
    const content = inner.trim().replace(/&#x27;/g, "'").replace(/&#39;/g, "'");
    out.push({ title, metaDesc, content });
  }
  return out;
}

/** Parse Hebrew HTML: id="h1".."h25" format, or plain <article> format */
export function parseHeHtml(html: string): { title: string; metaDesc: string; content: string }[] {
  const reId = /<article[^>]*id="h(\d+)"[^>]*>([\s\S]*?)<\/article>/gi;
  const byIndex: Record<number, string> = {};
  let m: RegExpExecArray | null;
  while ((m = reId.exec(html)) !== null) {
    const i = parseInt(m[1], 10);
    if (i >= 1 && i <= 25) byIndex[i] = m[2];
  }
  if (Object.keys(byIndex).length >= 25) {
    const out: { title: string; metaDesc: string; content: string }[] = [];
    for (let i = 1; i <= 25; i++) {
      const inner = byIndex[i] || '';
      const titleMatch = inner.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
      const title = titleMatch ? decodeHtml(titleMatch[1].replace(/<[^>]+>/g, '')) : '';
      const metaMatch = inner.match(/<p\s+class="meta"[^>]*>\s*<b>Meta Description:<\/b>\s*([\s\S]*?)<\/p>/);
      const metaDesc = metaMatch ? decodeHtml(metaMatch[1].replace(/<[^>]+>/g, '')) : '';
      const content = inner.trim().replace(/&#x27;/g, "'").replace(/&#39;/g, "'");
      out.push({ title, metaDesc, content });
    }
    return out;
  }
  return parseHeHtmlPlain(html);
}

/** Parse EN+AR HTML: first 25 <article class="card" id="..."> are EN, next 25 are AR */
export function parseEnArHtml(html: string): { title: string; metaDesc: string; content: string }[] {
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

export interface RunPhase7Input {
  heHtml: string | null;
  enArHtml: string;
}

/**
 * Run the Phase 7 update: parse HTML and upsert 75 articles.
 * Uses the Prisma instance provided (so in API route it uses production DB).
 */
export async function runPhase7Update(
  prisma: PrismaClient,
  input: RunPhase7Input
): Promise<{ updated: number; error?: string }> {
  const { heHtml, enArHtml } = input;

  const enArArticles = parseEnArHtml(enArHtml);
  if (enArArticles.length !== 50) {
    return { updated: 0, error: `Expected 50 EN+AR articles, got ${enArArticles.length}` };
  }

  let heArticles: { title: string; metaDesc: string; content: string }[] = [];
  if (heHtml) {
    heArticles = parseHeHtml(heHtml);
    if (heArticles.length !== 25) {
      return { updated: 0, error: `Expected 25 Hebrew articles, got ${heArticles.length}` };
    }
  }

  const enArticles = enArArticles.slice(0, 25);
  const arArticles = enArArticles.slice(25, 50);
  const allParsed = [...heArticles, ...enArticles, ...arArticles];
  const startIdx = heArticles.length === 25 ? 0 : 25;
  const endIdx = 75;
  const baseOrder = 200;

  // Group by slug (new schema: one row per slug with contentEn/He/Ar)
  type LocaleData = { title: string; metaDesc: string; content: string; excerpt: string };
  const bySlug = new Map<string, { en?: LocaleData; he?: LocaleData; ar?: LocaleData; articleOrder: number }>();

  for (let i = startIdx; i < endIdx; i++) {
    const { slug, locale } = SLUG_LOCALE[i];
    const parsedIdx = heArticles.length === 25 ? i : i - 25;
    const { title, metaDesc, content } = allParsed[parsedIdx];
    const ctaHref = getCtaHref(slug, locale);
    const contentWithCta =
      content.includes('Meta Description:') && content.includes('CTA #1:')
        ? normalizePhase7Content(content, ctaHref, locale, title)
        : replaceCtaLinks(content, ctaHref);
    const excerpt = metaDesc.slice(0, 160) + (metaDesc.length > 160 ? '…' : '');
    const articleOrder = baseOrder + i;

    const cur = bySlug.get(slug) ?? { articleOrder };
    cur[locale] = { title, metaDesc, content: contentWithCta, excerpt };
    cur.articleOrder = articleOrder;
    bySlug.set(slug, cur);
  }

  for (const [slug, data] of bySlug) {
    const en = data.en ?? data.he ?? data.ar!;
    await prisma.article.upsert({
      where: { slug },
      create: {
        slug,
        titleEn: data.en?.title ?? '',
        titleHe: data.he?.title ?? '',
        titleAr: data.ar?.title ?? '',
        contentEn: data.en?.content ?? '',
        contentHe: data.he?.content ?? '',
        contentAr: data.ar?.content ?? '',
        excerptEn: data.en?.excerpt ?? null,
        excerptHe: data.he?.excerpt ?? null,
        excerptAr: data.ar?.excerpt ?? null,
        metaTitleEn: data.en ? data.en.title.slice(0, 60) : null,
        metaTitleHe: data.he ? data.he.title.slice(0, 60) : null,
        metaTitleAr: data.ar ? data.ar.title.slice(0, 60) : null,
        metaDescEn: data.en?.metaDesc ?? null,
        metaDescHe: data.he?.metaDesc ?? null,
        metaDescAr: data.ar?.metaDesc ?? null,
        statusEn: data.en ? 'PUBLISHED' : 'DRAFT',
        statusHe: data.he ? 'PUBLISHED' : 'DRAFT',
        statusAr: data.ar ? 'PUBLISHED' : 'DRAFT',
        articleOrder: data.articleOrder,
        showRelatedArticles: true,
      },
      update: {
        ...(data.en && {
          titleEn: data.en.title,
          contentEn: data.en.content,
          excerptEn: data.en.excerpt,
          metaTitleEn: data.en.title.slice(0, 60),
          metaDescEn: data.en.metaDesc,
          statusEn: 'PUBLISHED' as const,
        }),
        ...(data.he && {
          titleHe: data.he.title,
          contentHe: data.he.content,
          excerptHe: data.he.excerpt,
          metaTitleHe: data.he.title.slice(0, 60),
          metaDescHe: data.he.metaDesc,
          statusHe: 'PUBLISHED' as const,
        }),
        ...(data.ar && {
          titleAr: data.ar.title,
          contentAr: data.ar.content,
          excerptAr: data.ar.excerpt,
          metaTitleAr: data.ar.title.slice(0, 60),
          metaDescAr: data.ar.metaDesc,
          statusAr: 'PUBLISHED' as const,
        }),
        articleOrder: data.articleOrder,
      },
    });
  }

  // Migrate ALL articles: canonical CTA, remove placeholder CTAs/Meta Description/duplicate title
  const allArticles = await prisma.article.findMany({
    select: { id: true, slug: true, titleEn: true, titleHe: true, titleAr: true, contentEn: true, contentHe: true, contentAr: true },
  });
  const headingLinkClass = 'text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded';

  const titleIsDestination = (title: string, locale: string) =>
    (locale === 'he' && title.startsWith('איסים ל')) ||
    (locale === 'en' && /^eSIM for /i.test(title)) ||
    (locale === 'ar' && /^eSIM\s+/.test(title));

  for (const a of allArticles) {
    const updateData: { contentEn?: string; contentHe?: string; contentAr?: string } = {};
    for (const locale of ['en', 'he', 'ar'] as const) {
      const content = a[`content${locale.charAt(0).toUpperCase() + locale.slice(1)}` as 'contentEn' | 'contentHe' | 'contentAr'];
      const title = a[`title${locale.charAt(0).toUpperCase() + locale.slice(1)}` as 'titleEn' | 'titleHe' | 'titleAr'];
      if (!content) continue;
      const dest = title && titleIsDestination(title, locale) ? getDestinationFromTitle(title, locale) : '';
      const ctaHref = getCtaHref(a.slug, locale);
      let newContent = content;

      newContent = newContent.replace(/<p\s+class="meta"[^>]*>\s*<b>Meta Description:<\/b>[\s\S]*?<\/p>\s*/gi, '');
      newContent = newContent.replace(/<div\s+class=['"]cta['"][^>]*>\s*<strong>CTA #1 \(mid-article\):<\/strong>[\s\S]*?<\/div>/gi, buildCtaBlockHtml(ctaHref, locale, dest || undefined));
      newContent = newContent.replace(/<div\s+class=['"]cta['"][^>]*>\s*<strong>CTA #2 \(final\):<\/strong>[\s\S]*?<\/div>/gi, buildCtaBlockHtml(ctaHref, locale, dest || undefined));
      newContent = newContent.replace(/<div\s+class=['"]cta['"][^>]*>\s*<strong>CTA #1 \(في منتصف المقال\):<\/strong>[\s\S]*?<\/div>/gi, buildCtaBlockHtml(ctaHref, locale, dest || undefined));
      newContent = newContent.replace(/<div\s+class=['"]cta['"][^>]*>\s*<strong>CTA #2 \(ختاماً\):<\/strong>[\s\S]*?<\/div>/gi, buildCtaBlockHtml(ctaHref, locale, dest || undefined));

      if (!newContent.includes('text-xl font-bold text-emerald-900 mb-2"><a href=')) {
        newContent = newContent.replace(
          /<p class="text-xl font-bold text-emerald-900 mb-2">([\s\S]*?)<\/p>\s*<a href="([^"]+)"[^>]*class="inline-block rounded-lg bg-emerald-600/g,
          `<p class="text-xl font-bold text-emerald-900 mb-2"><a href="$2" class="${headingLinkClass}">$1</a></p><a href="$2" class="inline-block rounded-lg bg-emerald-600`
        );
      }

      newContent = newContent.replace(/<div class="cta-block[^"]*"[^>]*>[\s\S]*?<\/div>/g, (block) => {
        const hrefMatch = block.match(/href="(https?:\/\/[^"]+)"/);
        const href = hrefMatch ? hrefMatch[1] : ctaHref;
        return buildCtaBlockHtml(href, locale, dest || undefined);
      });

      if (title) {
        const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        newContent = newContent.replace(new RegExp(`^\\s*<h1[^>]*>\\s*${escapedTitle}\\s*<\\/h1>\\s*`, 'i'), '');
      }

      if (newContent !== content) {
        updateData[`content${locale.charAt(0).toUpperCase() + locale.slice(1)}` as 'contentEn' | 'contentHe' | 'contentAr'] = newContent;
      }
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.article.update({ where: { id: a.id }, data: updateData });
    }
  }

  return { updated: endIdx - startIdx };
}
