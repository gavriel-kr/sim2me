/**
 * Read-only: what the navigation rows actually hold, so a menu change is made against the live
 * configuration rather than against the defaults in the source.
 *
 *   node agent-workspace/scripts/nav-menu-check.mjs
 */
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();
const prisma = new PrismaClient();

const rows = await prisma.siteSetting.findMany({
  where: { key: { in: ['nav_menu', 'footer_product', 'footer_company', 'footer_legal', 'footer_guides'] } },
});

if (rows.length === 0) console.log('no navigation rows in the database — the source defaults are what visitors get');
for (const r of rows) console.log(`${r.key} = ${r.value}`);

await prisma.$disconnect();
