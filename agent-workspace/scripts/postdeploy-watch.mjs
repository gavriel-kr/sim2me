/**
 * Poll production until the new code is visibly live, then stop.
 *
 * Two markers, both taken from `prod-baseline.mjs` before the push: the header carried one
 * `/he/contact` link and the hero headline carried `lg:text-6xl`. Both should be gone.
 */
const base = 'https://www.sim2me.net';
const started = Date.now();

function visibleHeader(html) {
  const cut = html.indexOf('<footer');
  return cut === -1 ? html : html.slice(0, cut);
}

for (let i = 1; i <= 40; i++) {
  const res = await fetch(`${base}/he?cachebust=${Date.now()}`, { cache: 'no-store' });
  const html = await res.text();
  const contactInHeader = [...visibleHeader(html).matchAll(/href="\/he\/contact"/g)].length;
  const oldHeadline = /lg:text-6xl/.test(html);
  const secs = Math.round((Date.now() - started) / 1000);
  console.log(`${String(secs).padStart(4)}s  status ${res.status}  contact-in-header ${contactInHeader}  old-headline ${oldHeadline}`);
  if (res.status === 200 && contactInHeader === 0 && !oldHeadline) {
    console.log(`\nThe new build is live after ${secs}s.`);
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 20000));
}
console.log('\nStill the old markers after 13 minutes. Check the Vercel deployment.');
process.exit(1);
