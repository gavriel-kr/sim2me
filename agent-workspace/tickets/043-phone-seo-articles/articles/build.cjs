/**
 * Ticket 043 — check the article files and build what the import writes to the database.
 *
 *   node agent-workspace/tickets/043-phone-seo-articles/articles/build.cjs
 *
 * Reads every <NN-slug>/meta.json and he/en/ar/hi.html, checks them, and writes dist/<slug>.json with
 * the database fields for all four languages. The FAQ section of each article becomes FAQPage
 * structured data appended to its HTML (the article page moves it into the head). Nothing here
 * touches the database.
 */

const fs = require('fs');
const path = require('path');

const here = __dirname;
const LOCALES = ['he', 'en', 'ar', 'hi'];
const SUFFIX = { en: 'En', he: 'He', ar: 'Ar', hi: 'Hi' };

// Pages an article may link to (after the /<locale> prefix). Article slugs are added from the folders.
const STATIC_PATHS = new Set([
  '/phone-plans', '/phone-plans/global', '/phone-plans/usa', '/phone-plans/europe',
  '/compatible-devices', '/installation-guide', '/help', '/refund', '/destinations', '/articles', '/how-it-works',
]);
const DESTINATIONS = new Set(['us', 'th', 'jp', 'gb', 'gr', 'ae', 'in', 'il', 'fr', 'it', 'es', 'de', 'tr', 'eg', 'jo', 'sg', 'my', 'vn', 'kr', 'mv', 'lk', 'ca', 'mx', 'ch', 'cy']);
// Existing guides (English, Hebrew and Arabic only) that the new articles may point to.
const EXISTING_GUIDES = new Set([
  'esim-usa-guide', 'esim-thailand-guide', 'esim-japan-guide', 'esim-uk-guide', 'esim-greece-guide',
  'esim-uae-dubai-guide', 'esim-india', 'esim-israel', 'esim-europe-guide', 'global-esim-card',
  'how-does-esim-work', 'esim-for-iphone', 'best-esim-for-travel',
]);

// Gabriel, 2026-09-29: the articles do not mention verification codes.
const FORBIDDEN = [/verif/i, /\bOTP\b/i, /one[- ]time (pass)?code/i, /קוד(י)? אימות/, /אימות דו/, /رمز (ال)?تحقق/, /رموز (ال)?تحقق/, /التحقق/, /सत्यापन/, /वेरिफ़िकेशन/, /वेरिफिकेशन/, /ओटीपी/];

const LIMITS = { metaTitle: [20, 62], metaDesc: [100, 165], excerpt: [60, 280], ogTitle: [15, 75], ogDesc: [60, 200], title: [15, 90] };

const folders = fs.readdirSync(here).filter((d) => /^\d\d-/.test(d) && fs.statSync(path.join(here, d)).isDirectory()).sort();
const slugs = new Set(folders.map((d) => JSON.parse(fs.readFileSync(path.join(here, d, 'meta.json'), 'utf8')).slug));
const problems = [];
const report = [];

function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

function decode(text) {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function checkBalanced(html, where) {
  for (const tag of ['div', 'section', 'table', 'thead', 'tbody', 'tr', 'ul', 'ol', 'li', 'p', 'h2', 'h3', 'a', 'strong', 'small']) {
    const open = (html.match(new RegExp(`<${tag}(\\s[^>]*)?>`, 'g')) || []).length;
    const close = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open !== close) problems.push(`${where}: <${tag}> opened ${open}, closed ${close}`);
  }
}

function checkLinks(html, locale, where) {
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const href of links) {
    if (/^https?:\/\//.test(href)) { problems.push(`${where}: external link ${href}`); continue; }
    if (!href.startsWith(`/${locale}/`) && href !== `/${locale}`) { problems.push(`${where}: link not in ${locale}: ${href}`); continue; }
    const rest = href.slice(locale.length + 1).split('#')[0];
    if (STATIC_PATHS.has(rest)) continue;
    let m = rest.match(/^\/destinations\/([a-z]{2})$/);
    if (m) { if (!DESTINATIONS.has(m[1])) problems.push(`${where}: unknown destination ${href}`); continue; }
    m = rest.match(/^\/articles\/([a-z0-9-]+)$/);
    if (m) {
      if (slugs.has(m[1])) continue;
      if (EXISTING_GUIDES.has(m[1]) && locale !== 'hi') continue;
      problems.push(`${where}: unknown article ${href}`);
      continue;
    }
    problems.push(`${where}: unknown page ${href}`);
  }
  return links.length;
}

/** The FAQ section's questions (h3) and answers (the paragraphs after each h3). */
function faqFrom(html, where) {
  const section = html.match(/<section class="article-faq">([\s\S]*?)<\/section>/);
  if (!section) { problems.push(`${where}: no FAQ section`); return []; }
  const parts = section[1].split(/<h3>/).slice(1);
  return parts.map((part) => {
    const [q, rest] = part.split('</h3>');
    const answer = [...rest.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => stripTags(m[1])).join(' ');
    return { q: decode(stripTags(q)), a: decode(answer) };
  });
}

fs.mkdirSync(path.join(here, 'dist'), { recursive: true });

for (const dir of folders) {
  const meta = JSON.parse(fs.readFileSync(path.join(here, dir, 'meta.json'), 'utf8'));
  const row = { slug: meta.slug, articleOrder: meta.order ?? 0, featuredImage: meta.featuredImage ?? null, showRelatedArticles: true };
  const counts = [];
  for (const locale of LOCALES) {
    const where = `${dir}/${locale}`;
    const file = path.join(here, dir, `${locale}.html`);
    if (!fs.existsSync(file)) { problems.push(`${where}: missing html`); continue; }
    const html = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trim();
    const m = meta.locales?.[locale];
    if (!m) { problems.push(`${where}: missing meta`); continue; }

    for (const [field, [min, max]] of Object.entries(LIMITS)) {
      const value = m[field];
      if (!value || !value.trim()) { problems.push(`${where}: empty ${field}`); continue; }
      if (value.length < min || value.length > max) problems.push(`${where}: ${field} is ${value.length} chars (${min}-${max})`);
    }
    if (!m.focusKeyword) problems.push(`${where}: empty focusKeyword`);

    const text = stripTags(html);
    for (const re of FORBIDDEN) {
      for (const source of [text, JSON.stringify(m)]) if (re.test(source)) problems.push(`${where}: forbidden term ${re}`);
    }
    if (/\u2014/.test(text + JSON.stringify(m))) problems.push(`${where}: em dash`);
    if (html.includes('<h1')) problems.push(`${where}: has an h1 (the page prints the title)`);
    if (m.focusKeyword && !text.toLowerCase().includes(m.focusKeyword.toLowerCase().split(' ')[0])) problems.push(`${where}: keyword not in text`);

    checkBalanced(html, where);
    const links = checkLinks(html, locale, where);
    const faq = faqFrom(html, where);
    if (faq.length < 3) problems.push(`${where}: only ${faq.length} FAQ entries`);
    if (!html.includes('class="article-cta"')) problems.push(`${where}: no call to action`);

    // In Hebrew and Arabic a dial code like +33 reads as 33+ unless it is isolated as left-to-right.
    const body = locale === 'he' || locale === 'ar'
      ? html.split(/(<[^>]+>)/).map((part) => (part.startsWith('<') ? part : part.replace(/\+\d{1,3}\b/g, (code) => `<bdi dir="ltr">${code}</bdi>`))).join('')
      : html;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: locale,
      mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    };
    const content = `${body}\n\n<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>\n`;

    const s = SUFFIX[locale];
    row[`title${s}`] = m.title;
    row[`content${s}`] = content;
    row[`excerpt${s}`] = m.excerpt;
    row[`focusKeyword${s}`] = m.focusKeyword;
    row[`metaTitle${s}`] = m.metaTitle;
    row[`metaDesc${s}`] = m.metaDesc;
    row[`ogTitle${s}`] = m.ogTitle;
    row[`ogDesc${s}`] = m.ogDesc;
    row[`canonicalUrl${s}`] = null;

    const words = text.split(/\s+/).filter(Boolean).length;
    counts.push(`${locale} ${words}w ${links}l ${faq.length}q`);
  }
  fs.writeFileSync(path.join(here, 'dist', `${meta.slug}.json`), JSON.stringify(row, null, 2) + '\n');
  report.push(`${dir.padEnd(40)} ${counts.join(' | ')}`);
}

console.log(report.join('\n'));
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(' -', p);
  process.exit(1);
}
console.log(`\nOK: ${folders.length} articles, ${folders.length * LOCALES.length} pages. dist/ written.`);
