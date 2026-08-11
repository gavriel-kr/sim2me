/**
 * Read-only baseline of production, taken before a deploy so the post-deploy smoke has something to
 * compare against. Nothing here writes, pays or sends.
 *
 *   node agent-workspace/scripts/prod-baseline.mjs
 */
const base = 'https://www.sim2me.net';

async function probe(path, method = 'GET') {
  try {
    const res = await fetch(`${base}${path}`, { method, redirect: 'manual' });
    return { status: res.status, len: (await res.text()).length };
  } catch (e) {
    return { status: `error: ${e.message}`, len: 0 };
  }
}

const paths = [
  '/en', '/he', '/ar',
  '/he/help', '/he/contact', '/he/how-it-works',
  '/he/destinations', '/he/checkout',
  '/admin/login', '/admin/orders',
  '/api/checkout/health',
];

for (const p of paths) {
  const { status, len } = await probe(p);
  console.log(`${String(status).padEnd(6)} ${String(len).padStart(7)}  ${p}`);
}

const health = await (await fetch(`${base}/api/checkout/health`)).text();
console.log('\nhealth:', health.slice(0, 400));

/* Does production still carry the contact link in its header? That is the visible before-state of this
   release's menu change, and the post-deploy check is that it is gone. */
const he = await (await fetch(`${base}/he`)).text();
const headerCut = he.indexOf('<footer');
const header = headerCut === -1 ? he : he.slice(0, headerCut);
console.log('header contact links now:', [...header.matchAll(/href="\/he\/contact"/g)].length);
console.log('hero headline class now has lg:text-6xl:', /lg:text-6xl/.test(he));
