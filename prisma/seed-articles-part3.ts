/**
 * Seed script: 45 SEO articles from Part 3 (15 HE, 15 EN, 15 AR)
 * Reads from prisma/content-part3.md, parses markdown, converts to HTML, upserts to DB.
 * Run: npx tsx prisma/seed-articles-part3.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SITE = 'https://www.sim2me.net';

/** Article slug → destination path segment (for /destinations/{code}) */
const SLUG_TO_DEST: Record<string, string> = {
  'esim-switzerland': 'ch',
  'esim-czech-republic': 'cz',
  'esim-prague': 'cz',
  'esim-austria': 'at',
  'esim-poland': 'pl',
  'esim-georgia': 'ge',
  'esim-south-korea': 'kr',
  'esim-mexico': 'mx',
  'esim-philippines': 'ph',
  'esim-brazil': 'br',
  'esim-montenegro': 'me',
  'esim-sri-lanka': 'lk',
  'esim-maldives': 'mv',
  'esim-india': 'in',
  'esim-indonesia': 'id',
  'esim-norway': 'no',
  'esim-sweden': 'se',
  'esim-denmark': 'dk',
  'esim-south-africa': 'za',
  'esim-croatia': 'hr',
  'esim-azerbaijan': 'az',
  'esim-bosnia-herzegovina': 'ba',
  'esim-hungary': 'hu',
  'esim-canada': 'ca',
  'esim-australia': 'au',
};

function getCtaHref(slug: string, locale: 'he' | 'en' | 'ar'): string {
  const code = SLUG_TO_DEST[slug];
  if (!code) return `${SITE}/destinations`;
  const prefix = locale === 'en' ? '/en' : `/${locale}`;
  return `${SITE}${prefix}/destinations/${code}`;
}

// 45 articles: HE 0–14, EN 15–29, AR 30–44
const SLUG_LOCALE: { slug: string; locale: 'he' | 'en' | 'ar' }[] = [
  { slug: 'esim-switzerland', locale: 'he' },
  { slug: 'esim-czech-republic', locale: 'he' },
  { slug: 'esim-prague', locale: 'he' },
  { slug: 'esim-austria', locale: 'he' },
  { slug: 'esim-poland', locale: 'he' },
  { slug: 'esim-georgia', locale: 'he' },
  { slug: 'esim-south-korea', locale: 'he' },
  { slug: 'esim-mexico', locale: 'he' },
  { slug: 'esim-philippines', locale: 'he' },
  { slug: 'esim-brazil', locale: 'he' },
  { slug: 'esim-montenegro', locale: 'he' },
  { slug: 'esim-sri-lanka', locale: 'he' },
  { slug: 'esim-maldives', locale: 'he' },
  { slug: 'esim-india', locale: 'he' },
  { slug: 'esim-indonesia', locale: 'he' },
  { slug: 'esim-mexico', locale: 'en' },
  { slug: 'esim-brazil', locale: 'en' },
  { slug: 'esim-south-korea', locale: 'en' },
  { slug: 'esim-philippines', locale: 'en' },
  { slug: 'esim-norway', locale: 'en' },
  { slug: 'esim-sweden', locale: 'en' },
  { slug: 'esim-denmark', locale: 'en' },
  { slug: 'esim-poland', locale: 'en' },
  { slug: 'esim-czech-republic', locale: 'en' },
  { slug: 'esim-austria', locale: 'en' },
  { slug: 'esim-south-africa', locale: 'en' },
  { slug: 'esim-maldives', locale: 'en' },
  { slug: 'esim-india', locale: 'en' },
  { slug: 'esim-indonesia', locale: 'en' },
  { slug: 'esim-croatia', locale: 'en' },
  { slug: 'esim-switzerland', locale: 'ar' },
  { slug: 'esim-austria', locale: 'ar' },
  { slug: 'esim-georgia', locale: 'ar' },
  { slug: 'esim-azerbaijan', locale: 'ar' },
  { slug: 'esim-bosnia-herzegovina', locale: 'ar' },
  { slug: 'esim-indonesia', locale: 'ar' },
  { slug: 'esim-maldives', locale: 'ar' },
  { slug: 'esim-south-korea', locale: 'ar' },
  { slug: 'esim-philippines', locale: 'ar' },
  { slug: 'esim-india', locale: 'ar' },
  { slug: 'esim-hungary', locale: 'ar' },
  { slug: 'esim-norway', locale: 'ar' },
  { slug: 'esim-canada', locale: 'ar' },
  { slug: 'esim-australia', locale: 'ar' },
  { slug: 'esim-brazil', locale: 'ar' },
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

/** Parse content-part3.md: ## מאמר 1 / ## Article 1 / ## المقال 1 → meta, title, content */
function parsePart3(content: string): { metaDesc: string; title: string; contentMd: string }[] {
  const articles: { metaDesc: string; title: string; contentMd: string }[] = [];
  const re = /\n## (מאמר \d+|Article \d+|المقال \d+)\s*\n/g;
  let m: RegExpExecArray | null;
  const segments: { start: number; end: number }[] = [];
  while ((m = re.exec(content)) !== null) {
    if (segments.length) segments[segments.length - 1].end = m.index;
    segments.push({ start: m.index, end: content.length });
  }
  for (const seg of segments) {
    const block = content.slice(seg.start, seg.end).trim();
    const metaMatch =
      block.match(/\*\*Meta Description:\*\*\s*(.+?)(?=\n\n#\s)/s) ||
      block.match(/\*\*وصف ميتا:\*\*\s*(.+?)(?=\n\n#\s)/s);
    const metaDesc = metaMatch ? metaMatch[1].trim() : '';
    const titleMatch = block.match(/\n# ([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const titleLineMatch = block.match(/\n# [^\n]+/);
    let contentMd = titleLineMatch ? block.slice(block.indexOf(titleLineMatch[0]) + titleLineMatch[0].length).trim() : block;
    contentMd = contentMd.replace(/\n---\s*$/s, '').trim();
    articles.push({ metaDesc, title, contentMd });
  }
  return articles;
}

/** Replace placeholder CTA lines with blockquote and in-text placeholders with real link */
function injectCta(contentMd: string, ctaHref: string, locale: 'he' | 'en' | 'ar'): string {
  const linkText = locale === 'he' ? 'לחצו כאן לרכישת eSIM' : locale === 'ar' ? 'اضغط هنا لشراء eSIM' : 'Get your eSIM';
  const ctaBlock = `\n\n> **${locale === 'he' ? 'הזמינו עכשיו' : locale === 'ar' ? 'اطلب الآن' : 'Ready to order?'}** [${linkText}](${ctaHref})\n`;
  let out = contentMd
    .replace(/\n👉\s*\[קישור לעמוד המוצר\]\s*\n?/g, ctaBlock)
    .replace(/\n👉\s*\[Link to product page\]\s*\n?/g, ctaBlock)
    .replace(/\n👉\s*\[رابط المنتج\]\s*\n?/g, ctaBlock);
  const inTextLink = locale === 'he' ? 'לחצו כאן' : locale === 'ar' ? 'هنا' : 'here';
  out = out
    .replace(/\[קישור לעמוד המוצר\]/g, `[${inTextLink}](${ctaHref})`)
    .replace(/\[Link to product page\]/g, `[${inTextLink}](${ctaHref})`)
    .replace(/\[رابط المنتج\]/g, `[${inTextLink}](${ctaHref})`);
  return out;
}

async function main() {
  const mdPath = path.join(__dirname, 'content-part3.md');
  if (!fs.existsSync(mdPath)) {
    console.error('Missing prisma/content-part3.md. Copy sim2me-45-articles-seo.md there.');
    process.exit(1);
  }
  const raw = fs.readFileSync(mdPath, 'utf-8');
  const parsed = parsePart3(raw);
  if (parsed.length !== 45) {
    console.error('Expected 45 articles, got', parsed.length);
    process.exit(1);
  }

  const baseOrder = 80;
  for (let i = 0; i < 45; i++) {
    const { slug, locale } = SLUG_LOCALE[i];
    const { metaDesc, title, contentMd } = parsed[i];
    const ctaHref = getCtaHref(slug, locale);
    const contentWithCta = injectCta(contentMd, ctaHref, locale);
    const content = md2html(contentWithCta, locale, ctaHref);
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
  console.log('Done. 45 part3 articles seeded.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
