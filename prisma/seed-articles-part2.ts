/**
 * Seed script: 30 SEO articles from Part 2 (10 HE, 10 EN, 10 AR)
 * Reads from prisma/content-part2.md, parses markdown, converts to HTML, upserts to DB.
 * Run: npx tsx prisma/seed-articles-part2.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SITE = 'https://www.sim2me.net';

// ─── Slug + locale for each of the 30 articles (HE 0–9, EN 10–19, AR 20–29) ───
const SLUG_LOCALE: { slug: string; locale: 'he' | 'en' | 'ar' }[] = [
  { slug: 'esim-italy', locale: 'he' },
  { slug: 'esim-spain', locale: 'he' },
  { slug: 'esim-japan', locale: 'he' },
  { slug: 'esim-portugal', locale: 'he' },
  { slug: 'esim-france', locale: 'he' },
  { slug: 'esim-thailand-travel', locale: 'he' },
  { slug: 'esim-hungary', locale: 'he' },
  { slug: 'esim-china', locale: 'he' },
  { slug: 'esim-morocco', locale: 'he' },
  { slug: 'esim-vietnam', locale: 'he' },
  { slug: 'esim-italy', locale: 'en' },
  { slug: 'esim-spain', locale: 'en' },
  { slug: 'esim-portugal', locale: 'en' },
  { slug: 'esim-france', locale: 'en' },
  { slug: 'esim-switzerland', locale: 'en' },
  { slug: 'esim-canada', locale: 'en' },
  { slug: 'esim-australia', locale: 'en' },
  { slug: 'esim-singapore', locale: 'en' },
  { slug: 'esim-vietnam', locale: 'en' },
  { slug: 'esim-morocco', locale: 'en' },
  { slug: 'esim-italy', locale: 'ar' },
  { slug: 'esim-spain', locale: 'ar' },
  { slug: 'esim-france', locale: 'ar' },
  { slug: 'esim-switzerland', locale: 'ar' },
  { slug: 'esim-japan', locale: 'ar' },
  { slug: 'esim-thailand-travel', locale: 'ar' },
  { slug: 'esim-egypt', locale: 'ar' },
  { slug: 'esim-morocco', locale: 'ar' },
  { slug: 'esim-malaysia', locale: 'ar' },
  { slug: 'esim-georgia', locale: 'ar' },
];

/** Simple markdown to HTML (bold, links, headings, paragraphs, lists, tables, blockquotes) */
function md2html(md: string): string {
  let s = md.trim();
  // Links before bold so [text](url) is not broken
  s = s.replace(/\[([^\]]+)\]\((https?:\/[^)]+)\)/g, '<a href="$2" class="text-emerald-700 underline hover:no-underline">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const lines = s.split(/\n/);
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
      out.push('<h3 class="text-lg font-bold mt-6 mb-2">' + trimmed.slice(4).trim() + '</h3>');
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      out.push('<h2 class="text-xl font-bold mt-8 mb-3">' + trimmed.slice(3).trim() + '</h2>');
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      out.push('<h2 class="text-xl font-bold mt-8 mb-3">' + trimmed.slice(2).trim() + '</h2>');
      i++;
      continue;
    }
    if (trimmed.startsWith('> ')) {
      const blockquote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        blockquote.push(lines[i].trim().slice(2).trim());
        i++;
      }
      out.push('<div class="my-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">' + blockquote.map(p => '<p class="mb-0">' + p + '</p>').join('') + '</div>');
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
        const thead = rows[0].map(c => '<th class="p-3 text-left border border-gray-200 bg-gray-100">' + c + '</th>').join('');
        const tbody = rows.slice(1).map(r => '<tr>' + r.map(c => '<td class="p-3 border border-gray-200">' + c + '</td>').join('') + '</tr>').join('');
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
      out.push('<ul class="list-disc pl-6 my-3 space-y-1">' + list.map(li => '<li>' + li + '</li>').join('') + '</ul>');
      continue;
    }
    out.push('<p class="my-3">' + trimmed + '</p>');
    i++;
  }
  return out.join('\n');
}

/** Parse content-part2.md into 30 articles (meta, title, content as markdown) */
function parseMdFile(content: string): { metaDesc: string; title: string; contentMd: string }[] {
  const articles: { metaDesc: string; title: string; contentMd: string }[] = [];
  const re = /\n## (מאמר \d+ –|Article \d+ –|المقال \d+ –)/g;
  let m: RegExpExecArray | null;
  const segments: { start: number; end: number }[] = [];
  while ((m = re.exec(content)) !== null) {
    if (segments.length) segments[segments.length - 1].end = m.index;
    segments.push({ start: m.index, end: content.length });
  }
  for (const seg of segments) {
    const block = content.slice(seg.start, seg.end).trim();
    const metaMatch = block.match(/\*\*Meta Description:\*\*\s*(.+?)(?=\n\n#\s)/s)
      || block.match(/\*\*وصف ميتا:\*\*\s*(.+?)(?=\n\n#\s)/s);
    const metaDesc = metaMatch ? metaMatch[1].trim() : '';
    const titleMatch = block.match(/\n# ([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    // Content: everything after the first "# Title" line (the H1), until end of block. Remove trailing ---.
    const titleLineMatch = block.match(/\n# [^\n]+/);
    let contentMd = titleLineMatch ? block.slice(block.indexOf(titleLineMatch[0]) + titleLineMatch[0].length).trim() : block;
    contentMd = contentMd.replace(/\n---\s*$/s, '').trim();
    articles.push({ metaDesc, title, contentMd });
  }
  return articles;
}

async function main() {
  const mdPath = path.join(__dirname, 'content-part2.md');
  if (!fs.existsSync(mdPath)) {
    console.error('Missing prisma/content-part2.md. Copy sim2me-seo-articles-part2.md there.');
    process.exit(1);
  }
  const raw = fs.readFileSync(mdPath, 'utf-8');
  const parsed = parseMdFile(raw);
  if (parsed.length !== 30) {
    console.error('Expected 30 articles, got', parsed.length);
    process.exit(1);
  }

  const baseOrder = 50;
  for (let i = 0; i < 30; i++) {
    const { slug, locale } = SLUG_LOCALE[i];
    const { metaDesc, title, contentMd } = parsed[i];
    const content = md2html(contentMd);
    const excerpt = metaDesc.slice(0, 160) + (metaDesc.length > 160 ? '…' : '');
    const articleOrder = baseOrder + (locale === 'he' ? i : locale === 'en' ? i - 10 : i - 20);

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
    console.log(`[${locale}] ${slug}: ${title.slice(0, 50)}…`);
  }
  console.log('Done. 30 part2 articles seeded.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
