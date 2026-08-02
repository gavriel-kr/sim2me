/**
 * Asserts that every rendered email speaks one language.
 *
 * The failure this guards against is the one a customer actually sees: a body carrying Hebrew,
 * English and Arabic stacked on top of each other because the send site had no locale to pass.
 * Latin characters are ignored — the brand name, activation codes and URLs are Latin in all three
 * languages — so the test is that Hebrew and Arabic never appear in the same message.
 *
 * Usage: node agent-workspace/scripts/email-lang-check.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('agent-workspace/tickets/033-email-overhaul/proofs/emails');

if (!fs.existsSync(DIR)) {
  console.error('No previews. Run: npx tsx agent-workspace/scripts/email-preview.ts --write');
  process.exit(1);
}

/** Visible text only: script tags and attributes carry markup, not copy. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ');
}

const HEBREW = /[\u0590-\u05FF]/;
const ARABIC = /[\u0600-\u06FF]/;

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html') && f !== 'index.html');
let failures = 0;

console.log(`Checking ${files.length} rendered emails\n`);

for (const f of files) {
  const text = visibleText(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const scripts = [];
  if (HEBREW.test(text)) scripts.push('Hebrew');
  if (ARABIC.test(text)) scripts.push('Arabic');

  const label = scripts.length ? scripts.join(' + ') : 'Latin only';
  if (scripts.length > 1) {
    failures++;
    console.log(`  FAIL  ${label.padEnd(18)} ${f}`);
  } else {
    console.log(`  ok    ${label.padEnd(18)} ${f}`);
  }
}

console.log('');
if (failures) {
  console.log(`${failures} email(s) mix Hebrew and Arabic in one body.`);
  process.exit(1);
}
console.log('PASS — no email mixes Hebrew and Arabic.');
