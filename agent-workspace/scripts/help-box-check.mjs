import fs from 'node:fs';

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');

for (const l of ['he', 'en', 'ar']) {
  const html = await (await fetch(`${base}/${l}/help`)).text();
  /* Entities have to be decoded before any copy comparison: the English lead-in contains an apostrophe,
     which arrives as `&#x27;` and would otherwise read as missing. */
  const shown = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
  const m = JSON.parse(fs.readFileSync(`src/messages/${l}.json`, 'utf8')).help;
  console.log(
    l,
    '| box gone:', !shown.includes(m.needHelp),
    '| jump link gone:', !shown.includes('href="#contact"'),
    '| form still there:', shown.includes('id="message"'),
    '| lead-in still there:', shown.includes(m.notFoundTitle)
  );
}
