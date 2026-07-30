/**
 * Standard destination article in English (mirrors Hebrew template CTA paths).
 */
const SITE = 'https://www.sim2me.net';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function ctaEn(dest, labelEn) {
  const href = `${SITE}/en/destinations/${dest}`;
  return `<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center"><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${href}" class="text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded">Get eSIM for ${esc(labelEn)} — Click here</a></p><a href="${href}" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">Get eSIM for ${esc(labelEn)}</a></div>`;
}

export function buildEnStandardDestinationHtml({ countryEn, dest }) {
  const p1 = `<p class="my-3">On a trip to ${esc(countryEn)}, reliable mobile data powers navigation, bookings, and staying in touch. With <strong>Sim2Me’s eSIM for ${esc(countryEn)}</strong> you activate a digital data line without removing your physical SIM, keeping your home number available for calls and OTPs when needed.</p>`;
  const h1 = `<h2 class="text-xl font-bold mt-8 mb-3">Why Sim2Me</h2>`;
  const p2 = `<p class="my-3">Sim2Me offers flexible plans for your stay, typically riding on strong local networks where we operate. Activation is quick via QR or link—ideally on Wi‑Fi before departure—so you land ready to connect.</p>`;
  const h2 = `<h2 class="text-xl font-bold mt-8 mb-3">What you usually get</h2>`;
  const ul = `<ul class="list-disc pl-6 my-3 space-y-1"><li>Fast mobile data in major cities and popular travel corridors</li><li>No long contract—pick the bundle that fits your trip</li><li>Easy account and email management</li><li>Support in English for setup questions</li></ul>`;
  const h3 = `<h2 class="text-xl font-bold mt-8 mb-3">Quick tips before you go</h2>`;
  const p3 = `<p class="my-3">Install on Wi‑Fi, disable data roaming on your home SIM while using the eSIM for cellular data, and limit background refresh on heavy apps. That keeps more allowance for maps and messages that matter.</p>`;
  return `${p1}\n${h1}\n${p2}\n${h2}\n${ul}\n${h3}\n${p3}\n${ctaEn(dest, countryEn)}\n${ctaEn(dest, countryEn)}`;
}

export function buildSeoEn(titleEn, plainExcerpt) {
  const excerpt = plainExcerpt.slice(0, 220);
  const metaDesc = plainExcerpt.slice(0, 155);
  return {
    excerptEn: excerpt,
    metaTitleEn: titleEn.slice(0, 60),
    metaDescEn: metaDesc,
    ogTitleEn: titleEn.slice(0, 60),
    ogDescEn: excerpt.slice(0, 200),
    focusKeywordEn: titleEn.slice(0, 80),
  };
}
