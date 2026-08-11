/**
 * Ticket 033 — assertions over the rendered email HTML.
 *
 * Reads what `email-preview.ts --write` produced and checks the things a human skimming twelve
 * previews would plausibly miss: a field that renders as `undefined`, a receipt row that silently
 * vanished, an account link that lost its locale, and above all the wallet balance appearing in a
 * customer's inbox.
 *
 *   node agent-workspace/scripts/email-verify.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = 'agent-workspace/tickets/033-email-overhaul/proofs/emails';

const files = (await readdir(DIR)).filter((f) => f.endsWith('.html') && f !== 'index.html');
const docs = [];
for (const f of files) {
  const html = await readFile(join(DIR, f), 'utf8');
  docs.push({
    f,
    html,
    isAdmin: f.startsWith('info_sim2me_gmail_com'),
    lang: html.match(/lang="([a-z]{2})"/)?.[1] ?? null,
    dir: html.match(/<html dir="(\w+)"/)?.[1] ?? null,
    title: html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '(no title)',
  });
}

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

console.log(`${docs.length} rendered emails\n`);

// ── Nothing leaked a placeholder ──────────────────────────────────────────────
for (const d of docs) {
  const junk = ['undefined', '[object Object]', 'NaN', 'null,', '{{', '}}']
    .filter((needle) => d.html.includes(needle));
  check(`no placeholder junk: ${d.title.slice(0, 44)}`, junk.length === 0, junk.join(', '));
}

// ── The balance is admin-only. This is the one Gabriel was explicit about ─────
console.log('');
const balanceWords = /balance|יתרה|الرصيد|eSIMaccess/i;
const customerWithBalance = docs.filter((d) => !d.isAdmin && balanceWords.test(d.html));
check('wallet balance appears in NO customer email', customerWithBalance.length === 0,
  customerWithBalance.map((d) => d.f).join(', '));
const admin = docs.find((d) => d.isAdmin);
check('wallet balance IS in the admin email', !!admin && /eSIMaccess Balance/.test(admin.html));
check('admin email flags a low balance', !!admin && /low — top up/.test(admin.html));

// ── Direction matches the language ───────────────────────────────────────────
console.log('');
for (const d of docs.filter((x) => x.lang)) {
  const expected = d.lang === 'en' ? 'ltr' : 'rtl';
  check(`dir=${expected} for lang=${d.lang}: ${d.title.slice(0, 34)}`, d.dir === expected, `got ${d.dir}`);
}

// ── The receipt actually rendered ────────────────────────────────────────────
console.log('');
const purchases = docs.filter((d) => d.html.includes('SM-DP+ Address'));
check('three purchase emails, one per language', purchases.length === 3, `got ${purchases.length}`);

/*
  Shapes, not literals. The fixture is a real order when the database has one, so asserting on a
  hardcoded order number tests the fixture rather than the template — which is exactly the false
  failure the first version of this file produced.
*/
const RECEIPT_SHAPES = {
  'order number': /<code[^>]*>[a-z0-9]{20,}<\/code>/i,
  amount: /\$\d+\.\d{2}/,
  date: /\b(\d{2}\/\d{2}\/\d{4}|[A-Z][a-z]{2} \d{2}, \d{4})\b/,
  ICCID: /<code[^>]*>89\d{15,18}<\/code>/,
};
for (const d of purchases) {
  const missing = Object.entries(RECEIPT_SHAPES).filter(([, re]) => !re.test(d.html)).map(([k]) => k);
  check(`receipt complete (${d.lang})`, missing.length === 0, `missing ${missing.join(', ')}`);
}
check('no destination row in customer mail', !purchases.some((d) => /Destination:|יעד:|الوجهة:/.test(d.html)));

// ── Account links carry their locale ─────────────────────────────────────────
console.log('');
for (const d of docs.filter((x) => x.lang && x.html.includes('/account'))) {
  const bare = /https?:\/\/[^"'\s]*?\/account(?![a-z])/g;
  const bad = (d.html.match(bare) ?? []).filter((u) => !new RegExp(`/${d.lang}/account`).test(u));
  check(`account links prefixed /${d.lang}/: ${d.title.slice(0, 34)}`, bad.length === 0, bad.join(' '));
}

// ── Characters are present, and email-safe ───────────────────────────────────
console.log('');
for (const d of docs.filter((x) => !x.isAdmin)) {
  check(`character present: ${d.title.slice(0, 44)}`, /\/characters\/email\/[a-z0-9-]+\.png/.test(d.html));
}
const anyModernFormat = docs.filter((d) => /characters\/[^"']*\.(avif|webp)/.test(d.html));
check('no AVIF or WebP anywhere (Outlook cannot render them)', anyModernFormat.length === 0,
  anyModernFormat.map((d) => d.f).join(', '));
check('no character in the admin email', !!admin && !/characters\/email/.test(admin.html));

// ── Plain-text alternative ───────────────────────────────────────────────────
console.log('');
const texts = (await readdir(DIR)).filter((f) => f.endsWith('.txt'));
/* The assertion is about customer mail, so admin text parts are excluded from the count rather than
   forbidden. Ticket 026's contact notification carries one — an admin email is welcome to be as
   deliverable as a customer one. */
const customerTexts = texts.filter((f) => !f.startsWith('info_sim2me_gmail_com'));
const customerDocs = docs.filter((d) => !d.isAdmin);
check('every customer email has a text part', customerTexts.length === customerDocs.length,
  `${customerTexts.length} text files for ${customerDocs.length} customer emails`);
for (const t of texts) {
  const body = await readFile(join(DIR, t), 'utf8');
  // Counted in lines rather than characters: a one-language OTP mail is legitimately short, and a
  // byte threshold tuned to the long templates would fail it for being concise. What makes a text
  // part worthless is being empty or a stub, which shows up as too few lines.
  const lines = body.split('\n').filter((l) => l.trim()).length;
  check(`text part is non-trivial and tag-free: ${t.slice(0, 40)}`, lines >= 3 && !/<[a-z/]/i.test(body));
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
