/**
 * Seed script: 60 SEO articles from Part 3 (20 HE, 20 EN, 20 AR)
 * Reads from prisma/content-part3.md, parses markdown, converts to HTML, appends CTA block, upserts to DB.
 * Run: npx tsx prisma/seed-articles-part3.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SITE = 'https://www.sim2me.net';

/** Article slug → destination path segment (for /destinations/{code}) */
const SLUG_TO_DEST: Record<string, string> = {
  'esim-bulgaria': 'bg',
  'esim-romania': 'ro',
  'esim-belgium': 'be',
  'esim-ireland': 'ie',
  'esim-iceland': 'is',
  'esim-finland': 'fi',
  'esim-costa-rica': 'cr',
  'esim-panama': 'pa',
  'esim-argentina': 'ar',
  'esim-colombia': 'co',
  'esim-peru': 'pe',
  'esim-chile': 'cl',
  'esim-south-africa': 'za',
  'esim-egypt': 'eg',
  'esim-jordan': 'jo',
  'esim-singapore': 'sg',
  'esim-slovenia': 'si',
  'esim-slovakia': 'sk',
  'esim-estonia': 'ee',
  'esim-latvia': 'lv',
  'esim-new-zealand': 'nz',
  'esim-israel': 'il',
  'esim-saudi-arabia': 'sa',
  'esim-qatar': 'qa',
  'esim-kuwait': 'kw',
  'esim-kenya': 'ke',
  'esim-tanzania': 'tz',
  'esim-malaysia': 'my',
  'esim-cambodia': 'kh',
  'esim-laos': 'la',
  'esim-taiwan': 'tw',
  'esim-hong-kong': 'hk',
  'esim-russia': 'ru',
  'esim-china': 'cn',
  'esim-bahrain': 'bh',
  'esim-oman': 'om',
  'esim-tunisia': 'tn',
  'esim-algeria': 'dz',
  'esim-kazakhstan': 'kz',
  'esim-uzbekistan': 'uz',
  'esim-seychelles': 'sc',
  'esim-mauritius': 'mu',
  'esim-sri-lanka': 'lk',
  'esim-hungary': 'hu',
  'esim-poland': 'pl',
};

function getCtaHref(slug: string, locale: 'he' | 'en' | 'ar'): string {
  const code = SLUG_TO_DEST[slug];
  if (!code) return `${SITE}/destinations`;
  const prefix = locale === 'en' ? '/en' : `/${locale}`;
  return `${SITE}${prefix}/destinations/${code}`;
}

/** CTA button text per locale (generic – no country name) */
function getCtaButtonText(locale: 'he' | 'en' | 'ar'): string {
  return locale === 'he' ? '← תוכניות eSIM' : locale === 'ar' ? 'خطط eSIM ←' : 'eSIM plans →';
}

// 60 articles: HE 0–19, EN 20–39, AR 40–59 (order matches parsePart3 output)
const SLUG_LOCALE: { slug: string; locale: 'he' | 'en' | 'ar' }[] = [
  { slug: 'esim-bulgaria', locale: 'he' },
  { slug: 'esim-romania', locale: 'he' },
  { slug: 'esim-belgium', locale: 'he' },
  { slug: 'esim-ireland', locale: 'he' },
  { slug: 'esim-iceland', locale: 'he' },
  { slug: 'esim-finland', locale: 'he' },
  { slug: 'esim-costa-rica', locale: 'he' },
  { slug: 'esim-panama', locale: 'he' },
  { slug: 'esim-argentina', locale: 'he' },
  { slug: 'esim-colombia', locale: 'he' },
  { slug: 'esim-peru', locale: 'he' },
  { slug: 'esim-chile', locale: 'he' },
  { slug: 'esim-south-africa', locale: 'he' },
  { slug: 'esim-egypt', locale: 'he' },
  { slug: 'esim-jordan', locale: 'he' },
  { slug: 'esim-singapore', locale: 'he' },
  { slug: 'esim-slovenia', locale: 'he' },
  { slug: 'esim-slovakia', locale: 'he' },
  { slug: 'esim-estonia', locale: 'he' },
  { slug: 'esim-latvia', locale: 'he' },
  { slug: 'esim-new-zealand', locale: 'en' },
  { slug: 'esim-ireland', locale: 'en' },
  { slug: 'esim-israel', locale: 'en' },
  { slug: 'esim-saudi-arabia', locale: 'en' },
  { slug: 'esim-qatar', locale: 'en' },
  { slug: 'esim-kuwait', locale: 'en' },
  { slug: 'esim-kenya', locale: 'en' },
  { slug: 'esim-tanzania', locale: 'en' },
  { slug: 'esim-peru', locale: 'en' },
  { slug: 'esim-argentina', locale: 'en' },
  { slug: 'esim-colombia', locale: 'en' },
  { slug: 'esim-costa-rica', locale: 'en' },
  { slug: 'esim-malaysia', locale: 'en' },
  { slug: 'esim-cambodia', locale: 'en' },
  { slug: 'esim-laos', locale: 'en' },
  { slug: 'esim-taiwan', locale: 'en' },
  { slug: 'esim-hong-kong', locale: 'en' },
  { slug: 'esim-belgium', locale: 'en' },
  { slug: 'esim-finland', locale: 'en' },
  { slug: 'esim-iceland', locale: 'en' },
  { slug: 'esim-russia', locale: 'ar' },
  { slug: 'esim-china', locale: 'ar' },
  { slug: 'esim-jordan', locale: 'ar' },
  { slug: 'esim-kuwait', locale: 'ar' },
  { slug: 'esim-qatar', locale: 'ar' },
  { slug: 'esim-bahrain', locale: 'ar' },
  { slug: 'esim-oman', locale: 'ar' },
  { slug: 'esim-tunisia', locale: 'ar' },
  { slug: 'esim-algeria', locale: 'ar' },
  { slug: 'esim-kazakhstan', locale: 'ar' },
  { slug: 'esim-uzbekistan', locale: 'ar' },
  { slug: 'esim-seychelles', locale: 'ar' },
  { slug: 'esim-mauritius', locale: 'ar' },
  { slug: 'esim-sri-lanka', locale: 'ar' },
  { slug: 'esim-singapore', locale: 'ar' },
  { slug: 'esim-belgium', locale: 'ar' },
  { slug: 'esim-hungary', locale: 'ar' },
  { slug: 'esim-poland', locale: 'ar' },
  { slug: 'esim-ireland', locale: 'ar' },
  { slug: 'esim-costa-rica', locale: 'ar' },
];

/** Inline markdown (bold + links) */
function inlineMd(t: string): string {
  return t
    .replace(/\[([^\]]+)\]\((https?:\/[^)]+)\)/g, '<a href="$2" class="text-emerald-700 underline hover:no-underline">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/** Markdown to HTML (matches part2 logic) */
function md2html(md: string, locale: 'he' | 'en' | 'ar', ctaHref: string): string {
  const lines = md.trim().split(/\n/);
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      out.push('<h3 class="text-lg font-bold mt-6 mb-2">' + inlineMd(trimmed.slice(4).trim()) + '</h3>');
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      out.push('<h2 class="text-xl font-bold mt-8 mb-3">' + inlineMd(trimmed.slice(3).trim()) + '</h2>');
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      out.push('<h2 class="text-xl font-bold mt-8 mb-3">' + inlineMd(trimmed.slice(2).trim()) + '</h2>');
      i++;
      continue;
    }
    if (trimmed.startsWith('> ')) {
      const blockquote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        blockquote.push(lines[i].trim().slice(2).trim());
        i++;
      }
      const raw = blockquote.join(' ');
      const linkMatch = raw.match(/\[([^\]]+)\]\((https?:\/[^)]+)\)/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const dirAttr = (locale === 'he' || locale === 'ar') ? ' dir="rtl"' : '';
        out.push('<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center"' + dirAttr + '><p class="text-xl font-bold text-emerald-900 mb-2">' + (locale === 'he' ? 'לרכישת איסים – לחצו כאן' : locale === 'ar' ? 'للحصول على eSIM – اضغط هنا' : 'Ready to get your eSIM?') + '</p><a href="' + ctaHref + '" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">' + linkText + '</a></div>');
      } else {
        const escaped = raw.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\((https?:\/[^)]+)\)/g, '<a href="$2" class="text-emerald-700 underline hover:no-underline">$1</a>');
        out.push('<div class="my-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p class="mb-0">' + escaped + '</p></div>');
      }
      continue;
    }
    if (trimmed.startsWith('| ') && trimmed.includes('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].trim().split('|').map(c => c.trim()).filter(Boolean);
        if (row.length) rows.push(row);
        i++;
      }
      if (rows.length >= 1) {
        const thead = rows[0].map(c => '<th class="p-3 text-left border border-gray-200 bg-gray-100">' + inlineMd(c) + '</th>').join('');
        const tbody = rows.slice(1).map(r => '<tr>' + r.map(c => '<td class="p-3 border border-gray-200">' + inlineMd(c) + '</td>').join('') + '</tr>').join('');
        out.push('<table class="w-full text-sm border-collapse mb-6"><thead><tr>' + thead + '</tr></thead><tbody>' + tbody + '</tbody></table>');
      }
      continue;
    }
    if (trimmed.startsWith('- ') || trimmed.match(/^\d+\.\s/)) {
      const list: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().match(/^\d+\.\s/))) {
        list.push(lines[i].trim().replace(/^[-]\s/, '').replace(/^\d+\.\s/, ''));
        i++;
      }
      out.push('<ul class="list-disc pl-6 my-3 space-y-1">' + list.map(li => '<li>' + inlineMd(li) + '</li>').join('') + '</ul>');
      continue;
    }
    out.push('<p class="my-3">' + inlineMd(trimmed) + '</p>');
    i++;
  }
  return out.join('\n');
}

/** Strip lines that contain CTA placeholders (we append a proper CTA block at the end) */
function stripPlaceholderLines(md: string): string {
  const placeholders = ['[קישור לעמוד המוצר]', '[Link to product page]', '[رابط المنتج]'];
  return md
    .split(/\n/)
    .filter((line) => !placeholders.some((p) => line.includes(p)))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Parse content-part3.md: blocks separated by ---, each with # Title and **Meta Description:** or **وصف ميتا:** */
function parsePart3(content: string): { metaDesc: string; title: string; contentMd: string }[] {
  const articles: { metaDesc: string; title: string; contentMd: string }[] = [];
  const blocks = content.split(/\n---\n/);
  for (const raw of blocks) {
    const block = raw
      .replace(/<!-- ARTICLE \d+ -->/g, '')
      .replace(/<div dir="rtl">/g, '')
      .replace(/<\/div>/g, '')
      .trim();
    const hasMeta = block.includes('**Meta Description:**') || block.includes('**وصف ميتا:**');
    const titleMatch = block.match(/^# ([^\n#]+)/m);
    if (!hasMeta || !titleMatch) continue;
    const title = titleMatch[1].trim();
    const metaLineMatch = block.match(/\*\*Meta Description:\*\*\s*(.+?)(?=\n|$)/s) || block.match(/\*\*وصف ميتا:\*\*\s*(.+?)(?=\n|$)/s);
    const metaDesc = metaLineMatch ? metaLineMatch[1].trim() : '';
    let afterTitle = block.slice(block.indexOf(titleMatch[0]) + titleMatch[0].length).trim();
    afterTitle = afterTitle.replace(/^\s*\*\*Meta Description:\*\*[^\n]*\n?/m, '').replace(/^\s*\*\*وصف ميتا:\*\*[^\n]*\n?/m, '').trim();
    const contentMd = stripPlaceholderLines(afterTitle);
    articles.push({ metaDesc, title, contentMd });
  }
  return articles;
}

/** Build CTA block HTML (button style, no "CTA" label) */
function buildCtaBlockHtml(ctaHref: string, locale: 'he' | 'en' | 'ar'): string {
  const dirAttr = locale === 'he' || locale === 'ar' ? ' dir="rtl"' : '';
  const heading = locale === 'he' ? 'לרכישת איסים – לחצו כאן' : locale === 'ar' ? 'للحصول على eSIM – اضغط هنا' : 'Ready to get your eSIM?';
  const buttonText = getCtaButtonText(locale);
  return `<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center"${dirAttr}><p class="text-xl font-bold text-emerald-900 mb-2">${heading}</p><a href="${ctaHref}" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">${buttonText}</a></div>`;
}

async function main() {
  const mdPath = path.join(__dirname, 'content-part3.md');
  if (!fs.existsSync(mdPath)) {
    console.error('Missing prisma/content-part3.md. Copy sim2me_all_60_articles.md there.');
    process.exit(1);
  }
  const raw = fs.readFileSync(mdPath, 'utf-8');
  const parsed = parsePart3(raw);
  if (parsed.length !== 60) {
    console.error('Expected 60 articles, got', parsed.length);
    process.exit(1);
  }

  const baseOrder = 80;
  for (let i = 0; i < 60; i++) {
    const { slug, locale } = SLUG_LOCALE[i];
    const { metaDesc, title, contentMd } = parsed[i];
    const ctaHref = getCtaHref(slug, locale);
    const bodyHtml = md2html(contentMd, locale, ctaHref);
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
    console.log(`[${locale}] ${slug}: ${title.slice(0, 45)}…`);
  }
  console.log('Done. 60 part3 articles seeded.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
