/**
 * Ticket 036 — assertions over the rendered pages, in all three languages.
 *
 * Fetches from the local dev server, so it proves what a visitor would actually see rather than what
 * the message files contain. Also picks up 026's standing rule: no support-hours claim anywhere.
 *
 *   node agent-workspace/scripts/036-content-check.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? 'http://localhost:3000';
const LOCALES = ['he', 'en', 'ar'];

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const get = async (path) => {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.text();
};

const stripTags = (html) => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');

// The golden tip, and the fact that it reads as post-landing
const GOLDEN_TITLE = {
  he: 'הטיפ הזהב',
  en: 'The golden tip',
  ar: 'النصيحة الذهبية',
};
const AFTER_LANDING = {
  he: 'אחרי הנחיתה',
  en: 'after you land',
  ar: 'بعد الوصول',
};

console.log('— /how-it-works: the golden tip\n');
for (const loc of LOCALES) {
  const html = await get(`/${loc}/how-it-works`);
  const text = stripTags(html);
  check(`golden tip present (${loc})`, text.includes(GOLDEN_TITLE[loc]));
  check(`reads as post-landing (${loc})`, text.includes(AFTER_LANDING[loc]));
  // The five steps render as an ordered list, so the numbering is the browser's, not ours
  const stepsMatch = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/g) ?? [];
  const goldenList = stepsMatch.find((ol) => /Wi-?Fi/i.test(ol) && /(Roaming|נדידת|تجوال)/.test(ol));
  const items = goldenList ? (goldenList.match(/<li/g) ?? []).length : 0;
  check(`five ordered steps (${loc})`, items === 5, `found ${items}`);
}

console.log('\n— /help: the structured data, which is the server-rendered half\n');
/*
  The accordion itself is client-rendered — `HelpClient` and `FAQSection` both read the array through
  react-query, so the questions are not in the HTML this script receives. The JSON-LD is server-
  rendered from the same array, so it is the thing that can be asserted over the wire; the grouping
  and the homepage slice are asserted against the array below.
*/
for (const loc of LOCALES) {
  const html = await get(`/${loc}/help`);
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check(`JSON-LD present (${loc})`, !!jsonLd);
  if (!jsonLd) continue;
  let parsed = null;
  try { parsed = JSON.parse(jsonLd[1]); } catch (e) { check(`JSON-LD parses (${loc})`, false, e.message); }
  if (!parsed) continue;
  check(`JSON-LD parses (${loc})`, true);
  const names = parsed.mainEntity.map((q) => q.name);
  check(`JSON-LD has 20 questions (${loc})`, names.length === 20, `got ${names.length}`);
  check(`no duplicate question (${loc})`, new Set(names).size === names.length);
  const bad = parsed.mainEntity.filter((q) => !q.name?.trim() || !q.acceptedAnswer?.text?.trim());
  check(`every question and answer non-empty (${loc})`, bad.length === 0, `${bad.length} empty`);
  const untranslated = parsed.mainEntity.filter((q) => /^(faq\.)?answer[A-Z]/.test(q.acceptedAnswer.text));
  check(`no missing translation keys leaked (${loc})`, untranslated.length === 0);
}

console.log('\n— the array behind both surfaces\n');
const { mockFaqs, FAQ_GROUPS } = await import('../../src/data/faq.ts');
/* The homepage slices the first five. These were the first five before 036 appended anything, so a
   change here means an entry was inserted rather than appended. */
const HOME_FIVE = ['doYouHaveApp', 'whatIsEsim', 'howToInstall', 'whenToActivate', 'compatibleDevices'];
const firstFive = mockFaqs.slice(0, 5).map((f) => f.questionKey);
check('homepage still shows the same five questions', JSON.stringify(firstFive) === JSON.stringify(HOME_FIVE),
  firstFive.join(', '));
check('every entry is tagged with a group', mockFaqs.every((f) => FAQ_GROUPS.includes(f.group)),
  mockFaqs.filter((f) => !FAQ_GROUPS.includes(f.group)).map((f) => f.questionKey).join(', '));
check('every group has at least one entry',
  FAQ_GROUPS.every((g) => mockFaqs.some((f) => f.group === g)),
  FAQ_GROUPS.filter((g) => !mockFaqs.some((f) => f.group === g)).join(', '));
check('no duplicate question key', new Set(mockFaqs.map((f) => f.questionKey)).size === mockFaqs.length);
check('no duplicate id', new Set(mockFaqs.map((f) => f.id)).size === mockFaqs.length);

/* Every key the two surfaces will ask for has to exist in all three files, or a customer sees the raw
   key. Checked here rather than by scraping, because the accordion is client-rendered. */
const { readFile } = await import('node:fs/promises');
for (const loc of LOCALES) {
  const m = JSON.parse(await readFile(`src/messages/${loc}.json`, 'utf8'));
  const missing = mockFaqs.flatMap((f) => [f.questionKey, f.answerKey, f.ctaLabelKey].filter(Boolean))
    .filter((k) => !m.faq?.[k]);
  check(`every FAQ key exists in ${loc}.json`, missing.length === 0, missing.join(', '));
  const missingGroups = FAQ_GROUPS.filter((g) => !m.help?.[g]);
  check(`every group heading exists in ${loc}.json`, missingGroups.length === 0, missingGroups.join(', '));
}

console.log('\n— 026: no support-hours claim on any rendered page\n');
const PAGES = ['', '/help', '/how-it-works', '/contact', '/about', '/checkout'];
const CLAIMS = [/24\s*\/\s*7/, /around the clock/i, /תוך (מספר )?שעות/, /within (a few|\d+) hours/, /خلال ساعات/];
for (const loc of LOCALES) {
  for (const p of PAGES) {
    const text = stripTags(await get(`/${loc}${p}`));
    const hit = CLAIMS.find((re) => re.test(text));
    check(`no support-hours claim: /${loc}${p || ''}`, !hit, hit ? String(hit) : '');
  }
}

console.log('\n— the data-only line is on the plan surface\n');
const DATA_ONLY = { he: 'גלישה בלבד', en: 'Data only', ar: 'بيانات فقط' };
/* The destination list is client-rendered, so the sample comes from the same catalogue endpoint the
   list itself reads. */
const catalogue = JSON.parse(await get('/api/packages'));
const pkg = (catalogue.packages ?? []).find((p) => p.visible !== false);
const planId = pkg?.packageCode;
if (!pkg || !planId) {
  check('found a plan to sample from the catalogue', false);
} else {
  const slug = pkg.locationCode.toLowerCase();
  for (const loc of LOCALES) {
    const html = await get(`/${loc}/destinations/${slug}/plan/${encodeURIComponent(planId)}`);
    check(`data-only line on the plan page (${loc})`, stripTags(html).includes(DATA_ONLY[loc]));
  }
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
