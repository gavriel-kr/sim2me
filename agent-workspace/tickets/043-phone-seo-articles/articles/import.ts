/**
 * Ticket 043 — write the built articles (dist/*.json, from build.cjs) to the articles table.
 *
 *   npx tsx agent-workspace/tickets/043-phone-seo-articles/articles/import.ts            (dry run)
 *   npx tsx agent-workspace/tickets/043-phone-seo-articles/articles/import.ts --apply    (write, as drafts)
 *   npx tsx agent-workspace/tickets/043-phone-seo-articles/articles/import.ts --apply --publish=he,en
 *
 * Local development uses the production database, so --apply writes to the live table. New articles are
 * created as DRAFT in every language unless --publish names languages; a draft is invisible to visitors
 * and search engines and can be checked with ?preview=1 while signed in as an admin. Re-running updates
 * the text and SEO fields of these 14 slugs and nothing else; statuses change only through --publish.
 */

process.loadEnvFile('C:/sim2me/.env');
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../../../../src/lib/prisma';

const apply = process.argv.includes('--apply');
const publishArg = process.argv.find((a) => a.startsWith('--publish='));
const publish = new Set((publishArg?.split('=')[1] ?? '').split(',').filter(Boolean));
const SUFFIX: Record<string, string> = { en: 'En', he: 'He', ar: 'Ar', hi: 'Hi' };
for (const l of publish) if (!SUFFIX[l]) throw new Error(`unknown language in --publish: ${l}`);

const TEXT_FIELDS = ['title', 'content', 'excerpt', 'focusKeyword', 'metaTitle', 'metaDesc', 'ogTitle', 'ogDesc', 'canonicalUrl'];

(async () => {
  const dir = join(__dirname, 'dist');
  // In the folders' order (01 … 14). The index sorts equal articleOrder newest first, so each article is
  // created one second after the next one: 01 ends up first on /articles.
  const files = readdirSync(__dirname)
    .filter((d) => /^\d\d-/.test(d))
    .sort()
    .map((d) => `${d.slice(3)}.json`);
  if (files.length !== 14) throw new Error(`expected 14 article folders, found ${files.length}`);
  const now = Date.now();

  for (const [index, file] of files.entries()) {
    const row = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Record<string, unknown> & { slug: string };
    const text: Record<string, unknown> = {};
    for (const s of Object.values(SUFFIX)) for (const f of TEXT_FIELDS) text[`${f}${s}`] = row[`${f}${s}`] ?? null;
    const statuses: Record<string, 'DRAFT' | 'PUBLISHED'> = {};
    for (const [l, s] of Object.entries(SUFFIX)) if (publish.has(l)) statuses[`status${s}`] = 'PUBLISHED';

    const existing = await prisma.article.findUnique({ where: { slug: row.slug }, select: { id: true } });
    const action = existing ? 'update' : 'create';
    console.log(`${apply ? '' : '[dry] '}${action} ${row.slug}${publish.size ? ` publish=${[...publish].join(',')}` : ''}`);
    if (!apply) continue;

    if (existing) {
      await prisma.article.update({ where: { id: existing.id }, data: { ...text, ...statuses } });
    } else {
      await prisma.article.create({
        data: {
          slug: row.slug,
          ...text,
          statusEn: 'DRAFT', statusHe: 'DRAFT', statusAr: 'DRAFT', statusHi: 'DRAFT',
          ...statuses,
          featuredImage: (row.featuredImage as string | null) ?? null,
          articleOrder: (row.articleOrder as number) ?? 0,
          showRelatedArticles: true,
          createdAt: new Date(now - index * 1000),
        } as Parameters<typeof prisma.article.create>[0]['data'],
      });
    }
  }
  console.log(apply ? 'done' : 'dry run only; add --apply to write');
  await prisma.$disconnect();
  process.exit(0);
})();
