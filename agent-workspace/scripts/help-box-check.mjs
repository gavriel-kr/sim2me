import fs from 'node:fs';

for (const l of ['he', 'en', 'ar']) {
  const html = await (await fetch(`http://localhost:3000/${l}/help`)).text();
  const shown = html.replace(/<script[\s\S]*?<\/script>/g, '');
  const m = JSON.parse(fs.readFileSync(`src/messages/${l}.json`, 'utf8')).help;
  console.log(
    l,
    '| box gone:', !shown.includes(m.needHelp),
    '| jump link gone:', !shown.includes('href="#contact"'),
    '| form still there:', shown.includes('id="message"'),
    '| lead-in still there:', shown.includes(m.notFoundTitle)
  );
}
