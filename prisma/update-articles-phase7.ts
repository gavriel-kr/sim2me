/**
 * CLI: Update 75 Phase 7 articles from HTML files.
 * Uses .env DATABASE_URL. For the LIVE site, run the update from the admin panel
 * or call POST /api/admin/update-phase7-articles (as admin) after deploy.
 *
 * Run: npx tsx prisma/update-articles-phase7.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { runPhase7Update } from '../src/lib/update-phase7-articles';

const prisma = new PrismaClient();

async function main() {
  const dir = __dirname;
  const hePath = path.join(dir, 'content-phase7-update-he.html');
  const enArPath = path.join(dir, 'content-phase7-update-en-ar.html');

  if (!fs.existsSync(enArPath)) {
    console.error('Missing EN+AR file:', enArPath);
    process.exit(1);
  }

  let heHtml: string | null = null;
  if (fs.existsSync(hePath)) {
    heHtml = fs.readFileSync(hePath, 'utf-8');
  } else {
    console.warn('Hebrew file not found:', hePath, '- updating only EN+AR (50 articles).');
  }

  const enArHtml = fs.readFileSync(enArPath, 'utf-8');
  const result = await runPhase7Update(prisma, { heHtml, enArHtml });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  console.log(`Done. ${result.updated} Phase 7 articles updated.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
