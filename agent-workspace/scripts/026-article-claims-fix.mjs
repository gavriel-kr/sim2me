/**
 * Ticket 026 — remove the support-hours claims from the five published article bodies.
 *
 * Dry run by default: prints the exact before and after for every replacement and writes nothing.
 * `--fix` applies them. Live content, so the write needs Gabriel's explicit go-ahead.
 *
 *   node agent-workspace/scripts/026-article-claims-fix.mjs
 *   node agent-workspace/scripts/026-article-claims-fix.mjs --fix
 */
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();
const prisma = new PrismaClient();
const apply = process.argv.includes('--fix');

/*
  One entry per localized body. `from` is matched literally against the stored HTML, so a miss is
  reported rather than guessed at — the point of this script is that nothing is edited blindly.
*/
const EDITS = [
  {
    slug: 'best-esim-for-travel',
    field: 'contentEn',
    from: 'We typically respond within a few hours',
    to: 'We answer every message',
  },
  {
    slug: 'esim-italy',
    field: 'contentEn',
    from: '<strong>English &amp; Hebrew support</strong> – 24/7 customer service',
    to: '<strong>Support in English and Hebrew</strong> – by email, on every order',
  },
  {
    slug: 'esim-italy',
    field: 'contentHe',
    from: '<strong>תמיכה בעברית</strong> – צוות שירות דובר עברית זמין 24/7',
    to: '<strong>תמיכה בעברית</strong> – במייל, לכל הזמנה',
  },
  {
    slug: 'esim-switzerland',
    field: 'contentHe',
    from: 'יש לכם שאלה? הצוות שלנו דובר עברית וזמין 24/7.',
    to: 'יש לכם שאלה? כתבו לנו והצוות שלנו יחזור אליכם בעברית.',
  },
  {
    slug: 'esim-colombia',
    field: 'contentHe',
    from: 'תמיכה בעברית 24/7.',
    to: 'תמיכה בעברית במייל.',
  },
];

let missed = 0;
const updates = new Map();

for (const e of EDITS) {
  const row = await prisma.article.findFirst({ where: { slug: e.slug }, select: { id: true, [e.field]: true } });
  if (!row) {
    console.log(`MISS  ${e.slug}: no such article`);
    missed++;
    continue;
  }
  const current = updates.get(`${row.id}:${e.field}`) ?? row[e.field] ?? '';
  const variants = [e.from, e.from.replace('&amp;', '&')];
  const hit = variants.find((v) => current.includes(v));
  if (!hit) {
    console.log(`MISS  ${e.slug} ${e.field}: the expected text is not present`);
    missed++;
    continue;
  }
  console.log(`EDIT  ${e.slug} ${e.field}`);
  console.log(`   -  ${hit}`);
  console.log(`   +  ${e.to}`);
  updates.set(`${row.id}:${e.field}`, current.replace(hit, e.to));
}

if (!apply) {
  console.log(`\nDry run. ${updates.size} field(s) would change, ${missed} miss(es). Re-run with --fix to write.`);
} else if (missed > 0) {
  console.log(`\n${missed} miss(es) — nothing written. Fix the expected text first.`);
} else {
  for (const [key, value] of updates) {
    const [id, field] = key.split(':');
    await prisma.article.update({ where: { id }, data: { [field]: value } });
    console.log(`WROTE ${id} ${field}`);
  }
  console.log(`\n${updates.size} field(s) updated.`);
}

await prisma.$disconnect();
