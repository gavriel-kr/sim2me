/**
 * Update Terms, Privacy, and Refund policy pages in the CMS with full content.
 * Run: npm run scripts:update-policies
 */
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { policies } from '../src/content/policies';

const prisma = new PrismaClient();

const POLICY_PAGES = [
  { slug: 'terms' as const, ...policies.terms },
  { slug: 'privacy' as const, ...policies.privacy },
  { slug: 'refund' as const, ...policies.refund },
];

async function main() {
  console.log('Updating Terms, Privacy, and Refund policy pages with full content...');
  for (const page of POLICY_PAGES) {
    const { slug, titleEn, titleHe, titleAr, contentEn, contentHe, contentAr } = page;
    await prisma.page.upsert({
      where: { slug },
      update: {
        titleEn,
        titleHe,
        titleAr,
        contentEn,
        contentHe,
        contentAr,
      },
      create: {
        slug,
        titleEn,
        titleHe,
        titleAr,
        contentEn,
        contentHe,
        contentAr,
        published: true,
      },
    });
    console.log('  Updated /' + slug);
  }
  console.log('Done. Refresh your website to see the full policies.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
