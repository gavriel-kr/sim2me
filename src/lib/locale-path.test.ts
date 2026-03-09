/**
 * Unit tests for locale path building. Run: npx tsx src/lib/locale-path.test.ts
 * Ensures language switcher produces correct URLs for all page types.
 */
import assert from 'node:assert';
import { buildLocalePath } from './locale-path';

// Articles — /ar in path must NOT match locale regex (was causing /heticles)
assert.strictEqual(buildLocalePath('/en/articles/esim-spain', 'he'), '/he/articles/esim-spain');
assert.strictEqual(buildLocalePath('/he/articles/esim-spain', 'en'), '/en/articles/esim-spain');
assert.strictEqual(buildLocalePath('/ar/articles/esim-spain', 'he'), '/he/articles/esim-spain');
assert.strictEqual(buildLocalePath('/articles/esim-spain', 'he'), '/he/articles/esim-spain');

// Destinations
assert.strictEqual(buildLocalePath('/en/destinations/spain', 'he'), '/he/destinations/spain');
assert.strictEqual(buildLocalePath('/he/destinations/japan', 'en'), '/en/destinations/japan');

// Help, contact, account — paths containing "he" or "ar" as substrings
assert.strictEqual(buildLocalePath('/en/help', 'he'), '/he/help');
assert.strictEqual(buildLocalePath('/en/contact', 'ar'), '/ar/contact');
assert.strictEqual(buildLocalePath('/en/account', 'he'), '/he/account');
assert.strictEqual(buildLocalePath('/en/account/orders', 'ar'), '/ar/account/orders');

// Root
assert.strictEqual(buildLocalePath('/en', 'he'), '/he');
assert.strictEqual(buildLocalePath('/he', 'en'), '/en');
assert.strictEqual(buildLocalePath('/ar', 'en'), '/en');
assert.strictEqual(buildLocalePath('/', 'he'), '/he');

// How-it-works, compatible-devices, etc.
assert.strictEqual(buildLocalePath('/en/how-it-works', 'he'), '/he/how-it-works');
assert.strictEqual(buildLocalePath('/he/compatible-devices', 'en'), '/en/compatible-devices');
assert.strictEqual(buildLocalePath('/en/checkout', 'ar'), '/ar/checkout');

console.log('✓ All locale-path tests passed');
