/**
 * Seed script: 60 SEO articles from Part 6 (20 HE, 20 EN, 20 AR)
 * Reads from prisma/content-part6-he.md, content-part6-en.md, content-part6-ar.md.
 * Parses markdown, converts to HTML, appends CTA block, upserts to DB.
 * Run: npx tsx prisma/seed-articles-part6.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SITE = 'https://www.sim2me.net';

/** Article slug → destination path segment (for /destinations/{code}) */
const SLUG_TO_DEST: Record<string, string> = {
  'esim-denmark': 'dk',
  'esim-norway': 'no',
  'esim-sweden': 'se',
  'esim-zanzibar': 'tz',
  'esim-tanzania': 'tz',
  'esim-guatemala': 'gt',
  'esim-ecuador': 'ec',
  'esim-north-macedonia': 'mk',
  'esim-oman': 'om',
  'esim-nepal': 'np',
  'esim-mongolia': 'mn',
  'esim-bali': 'id',
  'esim-laos': 'la',
  'esim-andorra': 'ad',
  'esim-monaco': 'mc',
  'esim-north-cyprus': 'cy',
  'esim-jamaica': 'jm',
  'esim-puerto-rico': 'pr',
  'esim-moldova': 'md',
  'esim-el-salvador': 'sv',
  'esim-estonia': 'ee',
  'esim-latvia': 'lv',
  'esim-lithuania': 'lt',
  'esim-slovakia': 'sk',
  'esim-slovenia': 'si',
  'esim-luxembourg': 'lu',
  'esim-malta': 'mt',
  'esim-belarus': 'by',
  'esim-ukraine': 'ua',
  'esim-gibraltar': 'gi',
  'esim-san-marino': 'sm',
  'esim-faroe-islands': 'fo',
  'esim-greenland': 'gl',
  'esim-jersey': 'je',
  'esim-guernsey': 'gg',
  'esim-isle-of-man': 'im',
  'esim-bermuda': 'bm',
  'esim-bahamas': 'bs',
  'esim-nigeria': 'ng',
  'esim-ghana': 'gh',
  'esim-ethiopia': 'et',
  'esim-uganda': 'ug',
  'esim-rwanda': 'rw',
  'esim-madagascar': 'mg',
  'esim-angola': 'ao',
  'esim-namibia': 'na',
  'esim-botswana': 'bw',
  'esim-zimbabwe': 'zw',
  'esim-mozambique': 'mz',
  'esim-senegal': 'sn',
  'esim-ivory-coast': 'ci',
  'esim-cameroon': 'cm',
  'esim-gabon': 'ga',
  'esim-congo': 'cg',
  'esim-guinea': 'gn',
  'esim-mali': 'ml',
  'esim-chad': 'td',
  'esim-niger': 'ne',
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

// 60 articles: HE 0–19, EN 20–39, AR 40–59
const SLUG_LOCALE: { slug: string; locale: 'he' | 'en' | 'ar' }[] = [
  { slug: 'esim-denmark', locale: 'he' },
  { slug: 'esim-norway', locale: 'he' },
  { slug: 'esim-sweden', locale: 'he' },
  { slug: 'esim-zanzibar', locale: 'he' },
  { slug: 'esim-tanzania', locale: 'he' },
  { slug: 'esim-guatemala', locale: 'he' },
  { slug: 'esim-ecuador', locale: 'he' },
  { slug: 'esim-north-macedonia', locale: 'he' },
  { slug: 'esim-oman', locale: 'he' },
  { slug: 'esim-nepal', locale: 'he' },
  { slug: 'esim-mongolia', locale: 'he' },
  { slug: 'esim-bali', locale: 'he' },
  { slug: 'esim-laos', locale: 'he' },
  { slug: 'esim-andorra', locale: 'he' },
  { slug: 'esim-monaco', locale: 'he' },
  { slug: 'esim-north-cyprus', locale: 'he' },
  { slug: 'esim-jamaica', locale: 'he' },
  { slug: 'esim-puerto-rico', locale: 'he' },
  { slug: 'esim-moldova', locale: 'he' },
  { slug: 'esim-el-salvador', locale: 'he' },
  { slug: 'esim-estonia', locale: 'en' },
  { slug: 'esim-latvia', locale: 'en' },
  { slug: 'esim-lithuania', locale: 'en' },
  { slug: 'esim-slovakia', locale: 'en' },
  { slug: 'esim-slovenia', locale: 'en' },
  { slug: 'esim-luxembourg', locale: 'en' },
  { slug: 'esim-malta', locale: 'en' },
  { slug: 'esim-moldova', locale: 'en' },
  { slug: 'esim-north-macedonia', locale: 'en' },
  { slug: 'esim-belarus', locale: 'en' },
  { slug: 'esim-ukraine', locale: 'en' },
  { slug: 'esim-gibraltar', locale: 'en' },
  { slug: 'esim-san-marino', locale: 'en' },
  { slug: 'esim-faroe-islands', locale: 'en' },
  { slug: 'esim-greenland', locale: 'en' },
  { slug: 'esim-jersey', locale: 'en' },
  { slug: 'esim-guernsey', locale: 'en' },
  { slug: 'esim-isle-of-man', locale: 'en' },
  { slug: 'esim-bermuda', locale: 'en' },
  { slug: 'esim-bahamas', locale: 'en' },
  { slug: 'esim-nigeria', locale: 'ar' },
  { slug: 'esim-ghana', locale: 'ar' },
  { slug: 'esim-ethiopia', locale: 'ar' },
  { slug: 'esim-uganda', locale: 'ar' },
  { slug: 'esim-rwanda', locale: 'ar' },
  { slug: 'esim-madagascar', locale: 'ar' },
  { slug: 'esim-angola', locale: 'ar' },
  { slug: 'esim-namibia', locale: 'ar' },
  { slug: 'esim-botswana', locale: 'ar' },
  { slug: 'esim-zimbabwe', locale: 'ar' },
  { slug: 'esim-mozambique', locale: 'ar' },
  { slug: 'esim-senegal', locale: 'ar' },
  { slug: 'esim-ivory-coast', locale: 'ar' },
  { slug: 'esim-cameroon', locale: 'ar' },
  { slug: 'esim-gabon', locale: 'ar' },
  { slug: 'esim-congo', locale: 'ar' },
  { slug: 'esim-guinea', locale: 'ar' },
  { slug: 'esim-mali', locale: 'ar' },
  { slug: 'esim-chad', locale: 'ar' },
  { slug: 'esim-niger', locale: 'ar' },
];

function inlineMd(t: string): string {
  return t
    .replace(/\[([^\]]+)\]\((https?:\/[^)]+)\)/g, '<a href="$2" class="text-emerald-700 underline hover:no-underline">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function md2html(md: string, locale: 'he' | 'en' | 'ar', _ctaHref: string): string {
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
    if (trimmed.startsWith('| ') && trimmed.includes('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].trim().split('|').map((c) => c.trim()).filter(Boolean);
        if (row.length) rows.push(row);
        i++;
      }
      if (rows.length >= 1) {
        const thead = rows[0].map((c) => '<th class="p-3 text-left border border-gray-200 bg-gray-100">' + inlineMd(c) + '</th>').join('');
        const tbody = rows.slice(1).map((r) => '<tr>' + r.map((c) => '<td class="p-3 border border-gray-200">' + inlineMd(c) + '</td>').join('') + '</tr>').join('');
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
      out.push('<ul class="list-disc pl-6 my-3 space-y-1">' + list.map((li) => '<li>' + inlineMd(li) + '</li>').join('') + '</ul>');
      continue;
    }
    out.push('<p class="my-3">' + inlineMd(trimmed) + '</p>');
    i++;
  }
  return out.join('\n');
}

function buildCtaBlockHtml(ctaHref: string, locale: 'he' | 'en' | 'ar'): string {
  const dirAttr = locale === 'he' || locale === 'ar' ? ' dir="rtl"' : '';
  const heading = locale === 'he' ? 'לרכישת איסים – לחצו כאן' : locale === 'ar' ? 'للحصول على eSIM – اضغط هنا' : 'Ready to get your eSIM?';
  const buttonText = getCtaButtonText(locale);
  return `<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center"${dirAttr}><p class="text-xl font-bold text-emerald-900 mb-2">${heading}</p><a href="${ctaHref}" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">${buttonText}</a></div>`;
}

const PLACEHOLDERS = ['[קישור לעמוד המוצר]', '[Product Link]', '[رابط المنتج]'];

function stripPlaceholderLines(md: string): string {
  return md
    .split(/\n/)
    .filter((line) => !PLACEHOLDERS.some((p) => line.includes(p)))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Parse one Part6 file (HE, EN, or AR) – blocks by ---, # Title, **Meta Description:** */
function parsePart6File(content: string): { metaDesc: string; title: string; contentMd: string }[] {
  const articles: { metaDesc: string; title: string; contentMd: string }[] = [];
  const blocks = content.split(/\n---\n/);
  for (const raw of blocks) {
    const block = raw.replace(/<!-- ARTICLE \d+ -->/g, '').trim();
    const hasMeta = block.includes('**Meta Description:**') || block.includes('**وصف ميتا:**');
    const titleMatch = block.match(/^# ([^\n#]+)/m);
    if (!hasMeta || !titleMatch) continue;
    const title = titleMatch[1].trim();
    const metaLineMatch = block.match(/\*\*Meta Description:\*\*\s*(.+?)(?=\n|$)/s) || block.match(/\*\*وصف ميتا:\*\*\s*(.+?)(?=\n|$)/s);
    const metaDesc = metaLineMatch ? metaLineMatch[1].trim() : '';
    const afterTitle = block.slice(block.indexOf(titleMatch[0]) + titleMatch[0].length).trim();
    let afterMeta = afterTitle
      .replace(/^\s*\*\*Meta Description:\*\*[^\n]*\n?/m, '')
      .replace(/^\s*\*\*وصف ميتا:\*\*[^\n]*\n?/m, '')
      .trim();
    const contentMd = stripPlaceholderLines(afterMeta);
    articles.push({ metaDesc, title, contentMd });
  }
  return articles;
}

async function main() {
  const dir = __dirname;
  const files: { path: string; locale: 'he' | 'en' | 'ar' }[] = [
    { path: path.join(dir, 'content-part6-he.md'), locale: 'he' },
    { path: path.join(dir, 'content-part6-en.md'), locale: 'en' },
    { path: path.join(dir, 'content-part6-ar.md'), locale: 'ar' },
  ];
  const all: { metaDesc: string; title: string; contentMd: string }[] = [];
  for (const { path: filePath, locale } of files) {
    if (!fs.existsSync(filePath)) {
      console.error('Missing', filePath);
      process.exit(1);
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = parsePart6File(raw);
    if (parsed.length !== 20) {
      console.error('Expected 20 articles in', filePath, 'got', parsed.length);
      process.exit(1);
    }
    all.push(...parsed);
  }
  if (all.length !== 60) {
    console.error('Expected 60 articles total, got', all.length);
    process.exit(1);
  }

  const baseOrder = 140;
  for (let i = 0; i < 60; i++) {
    const { slug, locale } = SLUG_LOCALE[i];
    const { metaDesc, title, contentMd } = all[i];
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
  console.log('Done. 60 part6 articles seeded.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
