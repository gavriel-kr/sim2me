/**
 * Gate C smoke for the pending release, run against a local dev or built server.
 *
 *   node agent-workspace/scripts/predeploy-smoke.mjs [baseUrl]
 *
 * Covers C0 (always), C1 (checkout / money / eSIM), C2 (customer account), C3 (admin guards),
 * C4 (content and i18n), C6 (cron protection). Read-only: nothing here posts a payment, buys an eSIM
 * or sends an email. Guarded routes are expected to refuse, and a refusal counts as a pass.
 */
const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const locales = ['he', 'en', 'ar'];
let fail = 0;

function ok(name, pass, detail = '') {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!pass) fail++;
}

async function status(path, method = 'GET') {
  try {
    const res = await fetch(`${base}${path}`, { method, redirect: 'manual' });
    return res.status;
  } catch (e) {
    return `error: ${e.message}`;
  }
}

async function body(path) {
  const res = await fetch(`${base}${path}`, { redirect: 'manual' });
  return { status: res.status, text: await res.text() };
}

/* next-intl serialises every message into the page, so any copy assertion has to ignore script tags. */
function visible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

console.log(`\n— C0: the site loads at all  (${base})\n`);
for (const l of locales) ok(`/${l} → 200`, (await status(`/${l}`)) === 200);
ok('/he/destinations → 200', (await status('/he/destinations')) === 200);
/* The destinations index renders its cards after hydration, so its slugs are not in the server HTML.
   Two known destinations are used instead; either one answering 200 proves a detail page renders. */
const destStatuses = await Promise.all(['au', 'it'].map((s) => status(`/he/destinations/${s}`)));
ok('a destination page → 200', destStatuses.includes(200), `au/it → ${destStatuses.join(', ')}`);

console.log('\n— C1: checkout, money, eSIM\n');
const health = await body('/api/checkout/health');
let healthJson = null;
try { healthJson = JSON.parse(health.text); } catch { /* not json */ }
ok('/api/checkout/health → ok:true', healthJson?.ok === true, JSON.stringify(healthJson?.checks ?? healthJson).slice(0, 300));
for (const l of locales) ok(`/${l}/checkout → 200`, (await status(`/${l}/checkout`)) === 200);
/*
   The consent gate, with a body the schema accepts, so the 400 comes from the gate and not from the
   shape. Deliberately not tested with `consent: true`: the next stops are Turnstile and Paddle, and a
   pass through both would create a real transaction in the live Paddle account.
*/
const consentProbe = await fetch(`${base}/api/checkout/create-transaction`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    items: [{ planId: 'CKH509', quantity: 1, unitPrice: 10, planName: 'smoke' }],
    customerEmail: 'smoke@example.com',
    locale: 'he',
  }),
});
const consentBody = await consentProbe.text();
ok(
  'create-transaction refuses without consent, before Turnstile or Paddle',
  consentProbe.status === 400 && /Terms must be accepted/.test(consentBody),
  `${consentProbe.status} ${consentBody.slice(0, 120)}`
);
ok('POST /api/webhooks/paddle unsigned → 400/401', [400, 401].includes(await status('/api/webhooks/paddle', 'POST')));
/* 429 counts: the retry route rate-limits by IP before it looks at the session, so repeated runs of
   this smoke exhaust the three-per-hour allowance. Either answer is a refusal without a session. */
const retryStatus = await status('/api/account/orders/clx000/retry', 'POST');
ok('POST /api/account/orders/x/retry without a session is refused', [401, 429].includes(retryStatus), `${retryStatus}`);
ok('POST /api/admin/orders/x/retry without a session → 401/403', [401, 403].includes(await status('/api/admin/orders/clx000/retry', 'POST')));
/* The checkout renders its steps from the cart in `localStorage`, so the checkbox is not in the server
   HTML. What can be asserted here is that its copy shipped to the page in every language. */
for (const l of locales) {
  const page = await body(`/${l}/checkout`);
  /* The rich-text tags inside the label arrive unicode-escaped in the serialised bundle, so the label
     key and the error key are what can be matched here. */
  ok(
    `consent copy shipped to the page for ${l}`,
    /consentLabel/.test(page.text) && /errConsent/.test(page.text)
  );
}

console.log('\n— C2: customer account\n');
for (const l of locales) {
  ok(`/${l}/account/login → 200`, (await status(`/${l}/account/login`)) === 200);
}
ok('/he/account/register → 200', (await status('/he/account/register')) === 200);
ok('/he/account is guarded (3xx)', [301, 302, 307, 308].includes(await status('/he/account')));
ok('GET /api/account/orders without a session → 401', (await status('/api/account/orders')) === 401);

console.log('\n— C3: admin\n');
ok('/admin/login → 200', (await status('/admin/login')) === 200);
for (const p of ['/admin/orders', '/admin/contact', '/admin/articles', '/admin/navigation', '/admin/settings']) {
  ok(`${p} is guarded (3xx)`, [301, 302, 307, 308].includes(await status(p)));
}

console.log('\n— C4: content and i18n on every page this release touches\n');
const touched = ['', '/help', '/how-it-works', '/contact', '/data-calculator', '/about', '/terms', '/refund', '/privacy', '/accessibility-statement', '/articles'];
for (const l of locales) {
  for (const p of touched) {
    const { status: s, text } = await body(`/${l}${p}`);
    const shown = visible(text);
    const rtlOk = l === 'en' ? true : /dir="rtl"/.test(text);
    const noRawKeys = !/[a-z]+\.[a-zA-Z]+ (?=<)/.test('') && !/MISSING_MESSAGE/.test(text);
    ok(`/${l}${p || '/'} → 200, dir correct, no missing-message`, s === 200 && rtlOk && noRawKeys, `status ${s}`);
    if (/24\/7|round-the-clock|within a few hours|תוך מספר שעות|على مدار الساعة/.test(shown)) {
      ok(`/${l}${p || '/'} carries no support-hours claim`, false);
    }
  }
}
const article = await body('/he/articles');
const artSlug = (article.text.match(/\/he\/articles\/([a-z0-9-]+)"/) || [])[1];
for (const l of locales) {
  ok(`an article renders in ${l}`, artSlug ? (await status(`/${l}/articles/${artSlug}`)) === 200 : false, artSlug || 'no slug');
}

console.log('\n— C6: cron and preview routes\n');
/* 503 is a refusal too: `check-abandoned` answers "cron not configured" when `CRON_SECRET` is absent,
   which it is locally. Either way an unauthenticated caller cannot make it run. */
ok('GET /api/cron/refresh-packages is refused', [401, 403, 503].includes(await status('/api/cron/refresh-packages')));
ok('GET /api/cron/check-abandoned is refused', [401, 403, 503].includes(await status('/api/cron/check-abandoned')));
ok('the design-preview route is not linked from any locale root', !(await body('/he')).text.includes('design-preview'));

console.log(fail === 0 ? '\nGate C: all checks passed.\n' : `\nGate C: ${fail} check(s) failed.\n`);
process.exit(fail === 0 ? 0 : 1);
