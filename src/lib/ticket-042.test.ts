/**
 * Ticket 042 — product ids, day-pass pricing, phone-plan rules.
 * Run: npx tsx src/lib/ticket-042.test.ts
 */
import assert from 'node:assert';
import { dayPassId, parseProductId, pikaId, renewalId, isValidProductRef, supplierOf } from './product-id';
import { fupKbps, pickDayPass, unlimitedPriceUsd, unlimitedPriceTable, unlimitedCostUsd } from './unlimited';
import { buildPhonePlan, phonePlansForDestination, phonePriceUsd, regionOf } from './phone-plans';
import { BADGE_TEXT_MAX, cleanBadgeText } from './homepage-sections-shared';
import type { EsimPackage } from './esimaccess';
import { getPhoneCatalog, type PikaPackage } from './pikasim';
import { isDueForNumberCheck, numberNotifiedKey } from './phone-number';

// ─── product ids ────────────────────────────────────────────
assert.deepStrictEqual(parseProductId('CKH491'), { kind: 'esim', code: 'CKH491' });
assert.deepStrictEqual(parseProductId(dayPassId('JP_2_Daily', 7)), { kind: 'daypass', code: 'JP_2_Daily', days: 7 });
assert.deepStrictEqual(parseProductId(pikaId('E-211-ES-AU-T-eo2-30D/60D-20GB')), { kind: 'pika', code: 'E-211-ES-AU-T-eo2-30D/60D-20GB' });
// Out-of-range or malformed day passes never degrade into a plain eSIMaccess purchase
assert.strictEqual(isValidProductRef(parseProductId('dp:JP_2_Daily:31')), false);
assert.strictEqual(isValidProductRef(parseProductId('dp:JP_2_Daily:0')), false);
assert.strictEqual(isValidProductRef(parseProductId('dp:JP_2_Daily')), false);
assert.strictEqual(parseProductId('dp:JP_2_Daily:abc').kind, 'daypass');
assert.strictEqual(supplierOf('pk:x'), 'PikaSim');
// Renewals: our base order id + a PikaSim top-up code (which may contain '/', '+' or ':')
assert.deepStrictEqual(parseProductId(renewalId('cmabc123', 'change-plus-30days-10gb')), { kind: 'renewal', orderId: 'cmabc123', code: 'change-plus-30days-10gb' });
assert.deepStrictEqual(parseProductId('rn:cmabc123:discover+-in-30days-3gb-px'), { kind: 'renewal', orderId: 'cmabc123', code: 'discover+-in-30days-3gb-px' });
assert.strictEqual(isValidProductRef(parseProductId('rn:cmabc123')), false);
assert.strictEqual(isValidProductRef(parseProductId('rn::code')), false);
assert.strictEqual(supplierOf('rn:a:b'), 'PikaSim');
assert.strictEqual(supplierOf('CKH491'), 'eSIMaccess');

// ─── day-pass pricing ───────────────────────────────────────
assert.strictEqual(fupKbps('1 Mbps'), 1000);
assert.strictEqual(fupKbps('512 Kbps'), 512);
assert.strictEqual(fupKbps(null), 0);
// The figures shown to Gabriel in the plan (Japan, $1.60/day wholesale)
assert.strictEqual(unlimitedPriceUsd(1.6, 3), 7.9);
assert.strictEqual(unlimitedPriceUsd(1.6, 7), 17.9);
assert.strictEqual(unlimitedPriceUsd(1.6, 15), 36.9);
// Never below cost plus Paddle's fee, for any day count
for (const perDay of [0.42, 0.8, 1.6, 2.9]) {
  const table = unlimitedPriceTable(perDay);
  assert.strictEqual(table.length, 30);
  table.forEach((price, i) => {
    const cost = unlimitedCostUsd(perDay, i + 1);
    assert.ok(price - cost - (price * 0.05 + 0.5) > 0, `loss at ${perDay}/day × ${i + 1}`);
    assert.ok(Math.abs(price * 10 - Math.round(price * 10)) < 1e-9 && Math.round(price * 100) % 10 === 0 || price === 0.9);
  });
}

const base = { slug: '', currencyCode: 'USD', duration: 1, durationUnit: 'DAY', description: '', speed: '4G', supportTopUpType: 3, favorite: false, activeType: 2 };
const gb2 = 2 * 1024 ** 3;
const packages = [
  { ...base, packageCode: 'JP-slow', name: 'Japan 2GB/Day', price: 16000, volume: gb2, location: 'Japan', locationCode: 'JP', dataType: 2, fupPolicy: '384 Kbps' },
  { ...base, packageCode: 'JP-fast', name: 'Japan 2GB/Day FUP1Mbps', price: 16000, volume: gb2, location: 'Japan', locationCode: 'JP', dataType: 2, fupPolicy: '1 Mbps' },
  { ...base, packageCode: 'JP-dear', name: 'Japan 2GB/Day (IIJ)', price: 19000, volume: gb2, location: 'Japan', locationCode: 'JP', dataType: 2, fupPolicy: '1 Mbps' },
  { ...base, packageCode: 'JP-1gb', name: 'Japan 1GB/Day', price: 8000, volume: gb2 / 2, location: 'Japan', locationCode: 'JP', dataType: 2 },
  { ...base, packageCode: 'JP-fixed', name: 'Japan 10GB 30Days', price: 60000, volume: gb2 * 5, duration: 30, location: 'Japan', locationCode: 'JP', dataType: 1 },
] as EsimPackage[];
// Same price → the faster post-allowance speed wins
assert.strictEqual(pickDayPass(packages, 'jp')?.packageCode, 'JP-fast');
assert.strictEqual(pickDayPass(packages, 'JP')?.costPerDayUsd, 1.6);
// An admin-hidden pass steps aside
assert.strictEqual(pickDayPass(packages, 'JP', new Set(['JP-fast']))?.packageCode, 'JP-slow');
assert.strictEqual(pickDayPass(packages, 'TH'), null);

// ─── phone plans ────────────────────────────────────────────
assert.strictEqual(phonePriceUsd(6.3), 7.9);
assert.strictEqual(phonePriceUsd(23.76), 28.9);
assert.strictEqual(phonePriceUsd(27.56), 33.9);
assert.strictEqual(phonePriceUsd(22.8), 27.9);

function pika(over: Partial<PikaPackage>): PikaPackage {
  return {
    packageCode: 'x', name: 'x', location: 'US', locationCode: 'US', region: 'USA', isGlobalPackage: false,
    volume: 1024 ** 3, volumeGB: 1, duration: 7, durationUnit: 'DAY', speed: '4G/LTE', price: 630,
    suggestedRetailPrice: 700, planType: 'data-voice-text', hasVoice: true, hasSms: true, voiceMinutes: 10,
    smsCount: 10, phoneNumberIncluded: true, activeType: 1, description: '', ...over,
  };
}
const us1 = buildPhonePlan(pika({ packageCode: 'change-plus-7days-1gb' }));
const us50 = buildPhonePlan(pika({ packageCode: 'change-plus-30days-50gb', volumeGB: 50, duration: 30, price: 7558 }));
const eu20 = buildPhonePlan(pika({
  packageCode: 'eu20', location: 'EU', locationCode: null, region: 'Europe', volumeGB: 20, duration: 30, price: 2756,
  voiceMinutes: -1, smsCount: 200, locationNetworkList: [{ locationName: 'France', locationCode: 'FR' }, { locationName: 'Greece', locationCode: 'GR' }],
}));
const gl1 = buildPhonePlan(pika({
  packageCode: 'gl1', location: 'GL', locationCode: null, region: 'Global', isGlobalPackage: true, price: 2280,
  locationNetworkList: [{ locationName: 'Japan', locationCode: 'JP' }, { locationName: 'France', locationCode: 'FR' }, { locationName: 'United States', locationCode: 'US' }],
}));
const vn = buildPhonePlan(pika({ packageCode: 'vn', location: 'VN', locationCode: null, region: null, hasVoice: false, hasSms: false, price: 1433 }));
const au = buildPhonePlan(pika({ packageCode: 'au', location: 'AU', locationCode: null, region: null, requiresActivationDate: true, price: 3370 }));

assert.strictEqual(regionOf({ location: 'GL', isGlobalPackage: true, region: 'Global' }), 'global');
assert.strictEqual(us1.dialCode, '+1');
assert.strictEqual(eu20.numberCountry, 'FR');
assert.strictEqual(eu20.dialCode, '+33');
assert.strictEqual(us1.visible, true);           // no market reference → shown
assert.strictEqual(us50.hiddenReason, 'aboveMarket');
assert.strictEqual(us50.visible, false);
assert.strictEqual(gl1.visible, true);           // shown despite being far above Airalo (decision)
assert.strictEqual(vn.hiddenReason, 'noCalls');
assert.strictEqual(au.visible, false);           // needs a booked activation date
// Only US and global numbers can be renewed and kept (PikaSim: country plans are single-cycle)
assert.strictEqual(us1.renewable, true);
assert.strictEqual(gl1.renewable, true);
assert.strictEqual(eu20.renewable, false);
assert.strictEqual(vn.renewable, false);
// An admin override beats the defaults, both ways
assert.strictEqual(buildPhonePlan(pika({ packageCode: 'change-plus-30days-50gb', volumeGB: 50, duration: 30, price: 7558 }),
  { visible: true, customPrice: 59, customTitle: null, featured: false, saleBadge: null, sortOrder: 0 }).visible, true);
assert.strictEqual(buildPhonePlan(pika({}), { visible: false, customPrice: null, customTitle: null, featured: false, saleBadge: null, sortOrder: 0 }).visible, false);

const all = [us1, us50, eu20, gl1, vn, au];
assert.deepStrictEqual(phonePlansForDestination(all, 'US').map((p) => p.code), ['change-plus-7days-1gb']);
assert.deepStrictEqual(phonePlansForDestination(all, 'fr').map((p) => p.code), ['eu20', 'gl1']);
assert.deepStrictEqual(phonePlansForDestination(all, 'JP').map((p) => p.code), ['gl1']);
assert.deepStrictEqual(phonePlansForDestination(all, 'EU-42').map((p) => p.code), ['eu20', 'gl1']);
assert.deepStrictEqual(phonePlansForDestination(all, 'VN').map((p) => p.code), []);

// ─── homepage activation badge text ─────────────────────────
// Unknown languages and non-strings dropped, whitespace trimmed, empty means "keep the default"
assert.deepStrictEqual(cleanBadgeText({ he: '  חדש!  ', en: '', ar: '   ', fr: 'x', hi: 5 }), { he: 'חדש!' });
assert.deepStrictEqual(cleanBadgeText(null), {});
assert.strictEqual(cleanBadgeText({ en: 'a'.repeat(200) }).en?.length, BADGE_TEXT_MAX);

// ─── "number ready" scheduled check: who is asked about, and when ─
{
  const at = (iso: string) => new Date(iso);
  const run = at('2026-10-01T10:30:00Z'); // minute 30: not the hourly run
  const hourly = at('2026-10-01T11:05:00Z'); // minute 5: the hourly run
  assert.strictEqual(isDueForNumberCheck(at('2026-09-29T10:00:00Z'), run), true); // 2 days old: every run
  assert.strictEqual(isDueForNumberCheck(at('2026-09-17T11:00:00Z'), run), true); // exactly 14 days: every run
  assert.strictEqual(isDueForNumberCheck(at('2026-09-01T10:00:00Z'), run), false); // a month old: not this run…
  assert.strictEqual(isDueForNumberCheck(at('2026-09-01T10:00:00Z'), hourly), true); // …but on the hourly one
  assert.strictEqual(isDueForNumberCheck(at('2026-03-01T10:00:00Z'), hourly), false); // over 180 days: never
  assert.strictEqual(isDueForNumberCheck(at('2026-10-02T10:00:00Z'), run), false); // clock skew: not in the future
  assert.strictEqual(numberNotifiedKey({ id: 'o1', iccid: '8901' }), 'phone_number_notified:8901');
  assert.strictEqual(numberNotifiedKey({ id: 'o1', iccid: null }), 'phone_number_notified:o1');
}

// ─── PikaSim outage: pages stop waiting, checkout still tries ─
(async () => {
  process.env.PIKASIM_API_KEY = 'test-key';
  let calls = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    calls++;
    throw new Error('PikaSim down');
  }) as typeof fetch;
  try {
    await assert.rejects(getPhoneCatalog()); // a page render tries once and fails
    assert.strictEqual(calls, 1);
    await assert.rejects(getPhoneCatalog()); // the next render within a minute does not ask at all
    assert.strictEqual(calls, 1);
    await assert.rejects(getPhoneCatalog({ patient: true })); // checkout / fulfilment still ask
    assert.strictEqual(calls, 2);
  } finally {
    globalThis.fetch = realFetch;
  }
  console.log('ticket-042 tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
