/**
 * Apply explicit Prisma patches (one locale at a time). Skips if target title already set.
 * Usage: node scripts/article-locale-fills/apply-locale-patches.mjs [--dry-run]
 * Import PATCHES from ./patches/batch-*.mjs
 */
import { PrismaClient } from '@prisma/client';
import { PATCHES as P1 } from './patches/batch-ar-001.mjs';
import { PATCHES as P2 } from './patches/batch-ar-002.mjs';

const PATCHES = [...P1, ...P2];

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

function titleKeyForPatch(data) {
  if (data.titleEn !== undefined) return 'titleEn';
  if (data.titleHe !== undefined) return 'titleHe';
  if (data.titleAr !== undefined) return 'titleAr';
  return null;
}

async function main() {
  let n = 0;
  for (const { slug, data } of PATCHES) {
    const article = await prisma.article.findUnique({ where: { slug } });
    if (!article) {
      console.warn('Missing slug', slug);
      continue;
    }
    const tk = titleKeyForPatch(data);
    if (tk && article[tk]?.trim()) {
      console.log('Skip (already filled)', slug, tk);
      continue;
    }
    if (dryRun) {
      console.log('[dry-run]', slug, Object.keys(data).join(','));
      n++;
      continue;
    }
    await prisma.article.update({ where: { slug }, data });
    console.log('Patched', slug);
    n++;
  }
  console.log(dryRun ? `Dry-run: ${n} patches` : `Applied ${n} patches`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
