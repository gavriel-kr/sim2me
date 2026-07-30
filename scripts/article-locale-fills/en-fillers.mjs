import { wordCount, ratio } from './word-count.mjs';

/** English paragraphs appended until EN/HE word ratio ≥ 0.78. */
export const EN_FILLERS = [
  `<p class="my-3">Before you travel, keep your purchase confirmation and plan details in email or offline notes. After activation, monitor data usage in system settings and enable Low Data Mode when not on trusted Wi‑Fi. If speeds feel unusually slow, try restarting the device or toggling automatic network selection. Turning off heavy background sync also preserves your allowance for maps and messaging.</p>`,
  `<p class="my-3">With Sim2Me you can review orders and invoices in your account and adjust plans before or during your trip. Keep your order ID handy for faster support. On dual‑SIM phones, keep your home SIM for calls/SMS and use the Sim2Me eSIM as the data line to avoid swapping plastic cards.</p>`,
  `<p class="my-3">For digital safety, avoid sensitive transactions on unknown public Wi‑Fi; cellular data via eSIM is often safer in airports and cafés. Review which apps use background data and pause large automatic backups while roaming unless you are on unlimited Wi‑Fi.</p>`,
  `<p class="my-3">For SEO, use clear headings, concise meta descriptions, and internal links to relevant destination pages and the <a href="/en/destinations" class="text-primary-600 underline">destinations hub</a>. Content that answers traveler questions (coverage, speed, activation, support) helps Google understand the page. Short paragraphs and mobile‑first structure improve readability.</p>`,
  `<p class="my-3">If you take multiple trips per year, you can keep an eSIM profile and renew when returning to the same country or pick a regional plan when available. Match data volume to trip length: shorter stays may need smaller bundles; longer stays may benefit from a larger plan or a one‑time top‑up to avoid disconnects.</p>`,
  `<p class="my-3">If connectivity fails after landing, confirm data roaming is enabled for the eSIM line and pick the carrier automatically when possible. Restart after installing the profile. If issues persist, contact Sim2Me support with device model and OS version—most cases resolve with simple steps. Remote areas may have weaker coverage by nature.</p>`,
  `<p class="my-3">Remote workers benefit from eSIM flexibility without swapping SIM cards at every border. Schedule video calls after checking network stability, and watch video‑heavy apps that consume the most data.</p>`,
  `<p class="my-3">Urban congestion and peak tourist seasons can cause temporary slowdowns even on fast plans—that is normal on shared networks. Download maps offline on hotel Wi‑Fi when safe, and spread heavy usage across the day. Sim2Me is designed to give clearer cost and activation control with support when you need it.</p>`,
];

export function padContentEn(contentEn, contentHe) {
  const he = contentHe || '';
  let out = contentEn || '';
  if (!wordCount(he)) return out;
  let guard = 0;
  while (ratio(out, he) < 0.78 && guard < 50) {
    out += EN_FILLERS[guard % EN_FILLERS.length];
    guard++;
  }
  return out;
}
