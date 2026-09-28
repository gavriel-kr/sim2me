/**
 * Ticket 042 — product ids, day-pass pricing, phone-plan rules.
 * Run: npx tsx src/lib/ticket-042.test.ts
 */
import assert from 'node:assert';
import { dayPassId, parseProductId, pikaId, renewalId, isValidProductRef, supplierOf } from './product-id';
import { fupKbps, pickDayPass, unlimitedPriceUsd, unlimitedPriceTable, unlimitedCostUsd } from './unlimited';
import { buildPhonePlan, phonePlansForDestination, phonePriceUsd, regionOf, toPublicPhonePlan } from './phone-plans';
import { BADGE_TEXT_MAX, cleanBadgeText } from './homepage-sections-shared';
import { isRetryableProfileError, type EsimPackage } from './esimaccess';
import { lpaString } from '../components/esim/EsimQrCode';
import { getPhoneCatalog, getPikaAccount, LOCAL_THROTTLE, waitForPikaEsim, type PikaPackage } from './pikasim';
import { parseResetMs, parseRetryAfterMs, resetLimiterForTests } from './pikasim-limiter';
import { computePlanWindow, daysFromValidity, isReminderDue, isValidInstallDate } from './phone-validity';
import { countrySlug, groupPhonePlans, groupSlugOf, slugFromLegacyHash } from './phone-groups';

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
assert.deepStrictEqual(phonePlansForDestination(all, 'fr').map((p) => p.code), ['gl1', 'eu20']); // global first, everywhere (2026-09-28)
assert.deepStrictEqual(phonePlansForDestination(all, 'JP').map((p) => p.code), ['gl1']);
assert.deepStrictEqual(phonePlansForDestination(all, 'EU-42').map((p) => p.code), ['gl1', 'eu20']);
assert.deepStrictEqual(phonePlansForDestination(all, 'VN').map((p) => p.code), []);

// ─── homepage activation badge text ─────────────────────────
// Unknown languages and non-strings dropped, whitespace trimmed, empty means "keep the default"
assert.deepStrictEqual(cleanBadgeText({ he: '  חדש!  ', en: '', ar: '   ', fr: 'x', hi: 5 }), { he: 'חדש!' });
assert.deepStrictEqual(cleanBadgeText(null), {});
assert.strictEqual(cleanBadgeText({ en: 'a'.repeat(200) }).en?.length, BADGE_TEXT_MAX);

// ─── Round 2 (2026-09-28): QR string, country list, eSIMaccess "busy" ─
assert.strictEqual(lpaString('rsp.example.com', 'ABC-123'), 'LPA:1$rsp.example.com$ABC-123');
assert.strictEqual(lpaString('rsp.example.com', 'LPA:1$rsp.example.com$ABC-123'), 'LPA:1$rsp.example.com$ABC-123');
assert.strictEqual(lpaString(null, 'ABC-123'), null);
assert.strictEqual(lpaString('rsp.example.com', ''), null);
assert.strictEqual(isRetryableProfileError('eSIMaccess API error: The system is busy, please try again later, [1]'), true);
assert.strictEqual(isRetryableProfileError('eSIMaccess API error: getting resource'), true);
assert.strictEqual(isRetryableProfileError('eSIMaccess API error: insufficient balance'), false);
{
  const pub = toPublicPhonePlan(eu20);
  assert.ok(pub.coverage.length > 1 && pub.coverage.length === pub.coverageCount); // the pop-up lists what the card counts
}

// ─── One page per kind of number, in site order (2026-09-28) ─
{
  const pub = (p: Parameters<typeof toPublicPhonePlan>[0]) => toPublicPhonePlan(p);
  const groups = groupPhonePlans([pub(eu20), pub(us1), pub(gl1), pub(us50)]);
  assert.deepStrictEqual(groups.map((g) => g.slug), ['global', 'usa', 'europe']); // global, the USA, Europe
  assert.strictEqual(groups[1].plans.length, 2); // both US plans on the USA page
  assert.deepStrictEqual(groups[1].coverage, ['US']);
  assert.ok(groups[2].coverage.length > 1); // Europe lists its countries
  assert.strictEqual(countrySlug('MN'), 'mongolia');
  assert.strictEqual(countrySlug('MV'), 'maldives');
  assert.strictEqual(groupSlugOf({ region: 'local', numberCountry: 'MN' }), 'mongolia');
  // Links from before the pages existed still land on the right page.
  assert.strictEqual(slugFromLegacyHash('#us'), 'usa');
  assert.strictEqual(slugFromLegacyHash('#europe'), 'europe');
  assert.strictEqual(slugFromLegacyHash('#global'), 'global');
  assert.strictEqual(slugFromLegacyHash('#local-mv'), 'maldives');
  assert.strictEqual(slugFromLegacyHash('#nothing'), null);
}

// ─── Phone plan dates, from our own orders (PikaSim reports none) ─
{
  // Our orders always write validity as "<n> days".
  assert.strictEqual(daysFromValidity('7 days'), 7);
  assert.strictEqual(daysFromValidity('1 day'), 1);
  assert.strictEqual(daysFromValidity('30 days'), 30);
  assert.strictEqual(daysFromValidity('Unlimited'), null);
  assert.strictEqual(daysFromValidity(''), null);

  const bought = new Date('2026-09-28T17:35:38Z');
  // No installation date: counted from the purchase, the earliest the plan can end.
  const fromPurchase = computePlanWindow({ purchasedAt: bought, planDays: 7, renewalDays: 0, installedOn: null });
  assert.strictEqual(fromPurchase.endsOn, '2026-10-05');
  assert.strictEqual(fromPurchase.endsAt, '2026-10-05T17:35:38.000Z');
  assert.strictEqual(fromPurchase.exact, false);
  // The customer's installation date moves it, and makes it exact.
  const fromInstall = computePlanWindow({ purchasedAt: bought, planDays: 7, renewalDays: 0, installedOn: '2026-10-01' });
  assert.strictEqual(fromInstall.endsOn, '2026-10-08');
  assert.strictEqual(fromInstall.exact, true);
  // Renewals add their days to the same plan.
  assert.strictEqual(computePlanWindow({ purchasedAt: bought, planDays: 7, renewalDays: 30, installedOn: '2026-10-01' }).endsOn, '2026-11-07');

  // The one reminder: from 48 hours before the end until the end.
  assert.strictEqual(isReminderDue('2026-10-05T17:35:38.000Z', new Date('2026-10-03T17:35:37Z')), false); // 48 h + 1 s before
  assert.strictEqual(isReminderDue('2026-10-05T17:35:38.000Z', new Date('2026-10-03T17:35:38Z')), true); // exactly 48 h before
  assert.strictEqual(isReminderDue('2026-10-05T17:35:38.000Z', new Date('2026-10-05T17:35:37Z')), true); // a second before the end
  assert.strictEqual(isReminderDue('2026-10-05T17:35:38.000Z', new Date('2026-10-05T17:35:38Z')), false); // ended: too late to help

  // Installation dates the customer may give: a real day, from the purchase (one day slack) to today (+1).
  const now = new Date('2026-09-30T12:00:00Z');
  assert.strictEqual(isValidInstallDate('2026-09-29', bought, now), true);
  assert.strictEqual(isValidInstallDate('2026-09-27', bought, now), true); // the purchase day in another time zone
  assert.strictEqual(isValidInstallDate('2026-09-26', bought, now), false); // before the purchase
  assert.strictEqual(isValidInstallDate('2026-10-01', bought, now), true); // "today" east of UTC
  assert.strictEqual(isValidInstallDate('2026-10-02', bought, now), false); // the future
  assert.strictEqual(isValidInstallDate('2026-02-30', bought, now), false); // not a real day
  assert.strictEqual(isValidInstallDate('29/09/2026', bought, now), false);
}

// ─── PikaSim outage: pages stop waiting, checkout still tries ─
(async () => {
  // Prisma may have loaded DATABASE_URL from .env on import. Without it the PikaSim limiter keeps its
  // counters in memory only, so nothing below can write to a real database.
  delete process.env.DATABASE_URL;
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

  // ─── PikaSim limiter: what PikaSim asked for after the suspension (2026-09-28) ─
  const now = 1_800_000_000_000;
  assert.strictEqual(parseResetMs('1800000060', now), 1_800_000_060_000); // Unix seconds
  assert.strictEqual(parseResetMs('1800000060000', now), 1_800_000_060_000); // Unix milliseconds
  assert.strictEqual(parseResetMs('30', now), now + 30_000); // seconds from now
  assert.strictEqual(parseResetMs(null, now), null);
  assert.strictEqual(parseResetMs('soon', now), null);
  assert.strictEqual(parseRetryAfterMs('120', now), now + 120_000);
  assert.strictEqual(parseRetryAfterMs('Wed, 21 Oct 2026 07:28:00 GMT', now), Date.parse('Wed, 21 Oct 2026 07:28:00 GMT'));

  let hits = 0;
  const answerWith = (status: number, body: unknown, headers: Record<string, string> = {}) => {
    globalThis.fetch = (async () => {
      hits++;
      return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
    }) as typeof fetch;
  };
  const heldBack = (e: unknown) => (e as { code?: string }).code === LOCAL_THROTTLE;
  try {
    // A 429 stops every request until Retry-After; the next one never leaves the server.
    resetLimiterForTests();
    hits = 0;
    answerWith(429, { success: false, error: 'Too many requests' }, { 'Retry-After': '30' });
    await assert.rejects(getPikaAccount(), (e: unknown) => (e as { status?: number }).status === 429);
    await assert.rejects(getPikaAccount(), heldBack);
    assert.strictEqual(hits, 1);

    // A suspended key: stop asking.
    resetLimiterForTests();
    hits = 0;
    answerWith(403, { success: false, error: 'Account suspended. Contact support for assistance.' });
    await assert.rejects(getPikaAccount(), (e: unknown) => (e as { status?: number }).status === 403);
    await assert.rejects(getPikaAccount(), heldBack);
    assert.strictEqual(hits, 1);

    // X-RateLimit-Remaining at zero: wait for X-RateLimit-Reset.
    resetLimiterForTests();
    hits = 0;
    answerWith(200, { success: true, data: { balance: 100 } }, { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '60' });
    await getPikaAccount();
    await assert.rejects(getPikaAccount(), heldBack);
    assert.strictEqual(hits, 1);

    // One instance on its own sends at most 20 a minute, whatever asks.
    resetLimiterForTests();
    hits = 0;
    answerWith(200, { success: true, data: { balance: 100 } }, { 'X-RateLimit-Remaining': '50' });
    for (let i = 0; i < 20; i++) await getPikaAccount();
    await assert.rejects(getPikaAccount(), heldBack);
    assert.strictEqual(hits, 20);

    // Waiting for a new eSIM gives up at a rate limit instead of retrying into it.
    resetLimiterForTests();
    hits = 0;
    answerWith(429, { success: false, error: 'Too many requests' });
    assert.strictEqual(await waitForPikaEsim('order-1', 5, 1), null);
    assert.strictEqual(hits, 1);

    // …and backs off on ordinary failures, up to its cap.
    resetLimiterForTests();
    hits = 0;
    answerWith(500, { success: false, error: 'upstream' });
    assert.strictEqual(await waitForPikaEsim('order-1', 3, 1), null);
    assert.strictEqual(hits, 3);
  } finally {
    globalThis.fetch = realFetch;
    resetLimiterForTests();
  }
  console.log('ticket-042 tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
