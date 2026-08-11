/**
 * Ticket 026, Phase 5. The contact page prefers `site_settings.support_email` over `brandConfig`, so
 * editing the seed does not change what a visitor sees on an existing database. This reads the live row
 * and, with `--fix`, points it at the confirmed mailbox.
 *
 *   node agent-workspace/scripts/026-support-email-check.mjs
 *   node agent-workspace/scripts/026-support-email-check.mjs --fix
 */
import { PrismaClient } from '@prisma/client';

const CONFIRMED = 'info@sim2me.net';
const prisma = new PrismaClient();

const row = await prisma.siteSetting.findUnique({ where: { key: 'support_email' } });
console.log('support_email row:', row ? row.value : '(no row — brandConfig is used)');

if (process.argv.includes('--fix') && row && row.value !== CONFIRMED) {
  await prisma.siteSetting.update({ where: { key: 'support_email' }, data: { value: CONFIRMED } });
  console.log(`updated to ${CONFIRMED}`);
}

await prisma.$disconnect();
