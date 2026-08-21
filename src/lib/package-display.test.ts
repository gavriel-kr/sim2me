/**
 * Run: npx tsx src/lib/package-display.test.ts
 */
import assert from 'node:assert';
import {
  asCheckoutLocale,
  buildPlanPagePath,
  destinationLine,
  resolvePackageDisplayFromList,
  sanitizeDestinationSlug,
} from './package-display';
import type { EsimPackage } from './esimaccess';

assert.strictEqual(sanitizeDestinationSlug('GR'), 'gr');
assert.strictEqual(sanitizeDestinationSlug('../etc/passwd'), 'etcpasswd');
assert.strictEqual(sanitizeDestinationSlug('eu-30'), 'eu-30');
assert.strictEqual(asCheckoutLocale('he'), 'he');
assert.strictEqual(asCheckoutLocale('xx'), 'en');
assert.strictEqual(
  buildPlanPagePath('he', 'gr', 'CKH123'),
  '/he/destinations/gr/plan/CKH123',
);

const pkg = {
  packageCode: 'CKH123',
  name: 'Greece 3GB 15Days',
  location: 'Greece',
  locationCode: 'GR',
  volume: 3 * 1024 * 1024 * 1024,
  duration: 15,
} as EsimPackage;

const fromCache = resolvePackageDisplayFromList([pkg], { planId: 'CKH123' });
assert.strictEqual(fromCache.packageName, 'Greece 3GB 15Days');
assert.strictEqual(fromCache.destination, 'Greece');
assert.strictEqual(fromCache.destinationSlug, 'gr');
assert.strictEqual(fromCache.dataAmount, '3 GB');
assert.strictEqual(fromCache.validity, '15 days');
assert.strictEqual(destinationLine(fromCache), 'Greece · 3 GB / 15 days');

const fromHints = resolvePackageDisplayFromList(null, {
  planId: 'CKH123',
  planName: 'Greece eSIM',
  destinationName: 'Greece',
  destinationSlug: 'gr',
});
assert.strictEqual(fromHints.packageName, 'Greece eSIM');
assert.strictEqual(fromHints.destination, 'Greece');

console.log('package-display tests passed');
