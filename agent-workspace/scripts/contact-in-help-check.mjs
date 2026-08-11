/**
 * Rendered-page checks for the menu/contact move and the two homepage copy items.
 *
 *   node agent-workspace/scripts/contact-in-help-check.mjs [baseUrl]
 *
 * Reads only. Everything asserted here is server-rendered HTML, so a pass means the markup left the
 * server correct — it is not a substitute for looking at the page.
 */
import fs from 'node:fs';

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const locales = ['he', 'en', 'ar'];
let failures = 0;

function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

async function get(path) {
  const res = await fetch(`${base}${path}`, { headers: { 'accept-language': 'en' } });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.text();
}

/* next-intl ships the whole message bundle to the client inside a script tag, so every string exists
   in the response whether or not the page shows it. Copy assertions have to look at markup only. */
function visible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

const messages = Object.fromEntries(
  locales.map((l) => [l, JSON.parse(fs.readFileSync(`src/messages/${l}.json`, 'utf8'))])
);

// 1. The contact page still exists and still renders its form.
for (const locale of locales) {
  const html = await get(`/${locale}/contact`);
  check(
    `/${locale}/contact still renders the form`,
    html.includes('id="message"') && html.includes(messages[locale].contact.send)
  );
}

// 2. The help page carries the same form plus the new lead-in, and the jump target exists.
for (const locale of locales) {
  const html = await get(`/${locale}/help`);
  const m = messages[locale].help;
  const shown = visible(html);
  check(`/${locale}/help has the lead-in heading`, shown.includes(m.notFoundTitle), m.notFoundTitle);
  check(`/${locale}/help has the lead-in text`, shown.includes(m.notFoundDesc));
  check(`/${locale}/help renders the message form`, html.includes('id="message"') && html.includes('id="subject"'));
  /* The anchor stays — the footer and any deep link use it. What used to jump to it was the "still need
     help" box at the top of the page, and that box was removed afterwards, so there is nothing left to
     assert about a link to it. `help-box-check.mjs` covers its absence. */
  check(`/${locale}/help has the #contact anchor`, html.includes('id="contact"'));
  check(
    `/${locale}/help drops the "check the help centre" tip`,
    !shown.includes(messages[locale].contact.beforeTip1),
    'that tip would point at this page'
  );
  check(
    `/${locale}/help keeps the other two tips`,
    shown.includes(messages[locale].contact.beforeTip2) && shown.includes(messages[locale].contact.beforeTip3)
  );
}

// 3. No contact entry in the header nav. The footer keeps one, so count only links above the footer.
for (const locale of locales) {
  const shown = visible(await get(`/${locale}/help`));
  const cut = shown.indexOf('<footer');
  const header = cut === -1 ? shown : shown.slice(0, cut);
  const navHits = [...header.matchAll(/href="\/(?:en|he|ar)\/contact"/g)].length;
  check(`/${locale} header has no contact link`, navHits === 0, `found ${navHits}`);
  const footer = cut === -1 ? '' : shown.slice(cut);
  check(`/${locale} footer still links to contact`, /href="\/(?:en|he|ar)\/contact"/.test(footer));
}

// 4. Homepage copy: the ellipsis, and a headline that is not sized for two lines any more.
for (const locale of locales) {
  const html = await get(`/${locale}`);
  const sub = messages[locale].home.heroSubtitle;
  check(`/${locale} subtitle ends in three dots`, sub.endsWith('...') && visible(html).includes(sub), sub);
  check(
    `/${locale} headline uses the fluid single-line size`,
    /clamp\(2rem,3\.1vw,2\.4rem\)/.test(html.replace(/\\/g, '')) || /lg:text-\[clamp/.test(html),
    'lg:text-[clamp(2rem,3.1vw,2.4rem)]'
  );
  check(`/${locale} headline no longer set to text-6xl`, !/lg:text-6xl/.test(html));
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
