/**
 * Ticket 033 — the failure modes, not the happy path.
 *
 * `email-verify.mjs` checks what a correct email looks like. This checks that the changes cannot
 * break anything that worked before: a nineteen-row database of orders with no `locale`, callers
 * that pass none of the new fields, a supplier QR that will not download, and a balance lookup that
 * returns nothing.
 *
 *   npx tsx agent-workspace/scripts/email-behavior.ts
 */
import { config } from 'dotenv';
import { join } from 'node:path';
import { mkdir, readdir, readFile, rm } from 'node:fs/promises';

config();

const OUT = join(process.cwd(), 'agent-workspace/tickets/033-email-overhaul/proofs/behavior');

let failures = 0;
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

async function latest(): Promise<string> {
  const files = (await readdir(OUT)).filter((f) => f.endsWith('.html'));
  const newest = files.map((f) => join(OUT, f)).sort().at(-1)!;
  return readFile(newest, 'utf8');
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  process.env.EMAIL_PREVIEW_DIR = OUT;

  const { toEmailLocale, sendPostPurchaseEmail, sendAdminOrderNotificationEmail } =
    await import('../../src/lib/email');

  // ── A locale column that is null must behave exactly as before it existed ───
  check('toEmailLocale(null) is Hebrew', toEmailLocale(null) === 'he');
  check('toEmailLocale(undefined) is Hebrew', toEmailLocale(undefined) === 'he');
  check('toEmailLocale("") is Hebrew', toEmailLocale('') === 'he');
  check('toEmailLocale("fr") is Hebrew', toEmailLocale('fr') === 'he');
  check('toEmailLocale("en") is English', toEmailLocale('en') === 'en');
  check('toEmailLocale("ar") is Arabic', toEmailLocale('ar') === 'ar');

  // ── A caller that passes none of the new fields still gets a valid email ────
  console.log('');
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await sendPostPurchaseEmail('legacy@example.com', {
    customerName: 'Legacy Caller',
    planName: 'Japan 3GB 15Days',
    dataGb: '3 GB',
    validityDays: '15 days',
    qrCodeUrl: null,
    smdpAddress: 'rsp.example.com',
    activationCode: 'ABC-123',
    loginLink: 'https://www.sim2me.net/he/account',
    email: 'legacy@example.com',
  });
  const legacy = await latest();
  check('legacy call renders', legacy.includes('Japan 3GB 15Days'));
  check('legacy call omits the receipt block entirely', !legacy.includes('אישור הזמנה:'));
  check('legacy call has no empty rows or junk',
    !/undefined|\[object Object\]|NaN/.test(legacy) && !/<strong>[^<]*<\/strong>\s*<\/li>/.test(legacy));
  check('legacy call defaults to Hebrew', /<html dir="rtl" lang="he">/.test(legacy));
  check('no-QR path shows the account fallback line', legacy.includes('קוד ה-QR זמין'));

  // ── A QR the supplier will not serve must not take the email down ──────────
  console.log('');
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const sent = await sendPostPurchaseEmail('broken-qr@example.com', {
    customerName: 'Broken QR',
    planName: 'Greece 1GB 7Days',
    dataGb: '1 GB',
    validityDays: '7 days',
    qrCodeUrl: 'https://static.example.invalid/does-not-resolve.png',
    smdpAddress: 'rsp.example.com',
    activationCode: 'ABC-123',
    loginLink: 'https://www.sim2me.net/en/account',
    email: 'broken-qr@example.com',
    orderNo: 'ord_test_0001',
    amountPaid: 19.9,
    currency: 'USD',
    orderDate: new Date('2026-08-02T00:00:00Z'),
    iccid: '8944478000001234567',
  }, 'en');
  const brokenQr = await latest();
  check('unreachable QR still sends', sent === true);
  check('unreachable QR keeps the inline image tag', brokenQr.includes('does-not-resolve.png'));
  check('unreachable QR keeps the full receipt', brokenQr.includes('ord_test_0001') && brokenQr.includes('$19.90'));

  // ── A balance lookup that returned nothing must not block the admin alert ───
  console.log('');
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await sendAdminOrderNotificationEmail({
    customerName: 'Balance Down', customerEmail: 'x@example.com',
    packageName: 'Italy 5GB', destination: 'IT', dataAmount: '5 GB', validity: '30 days',
    amountCharged: 25, supplierCost: 15,
    orderId: 'x', orderNo: 'ord_test_0002',
    adminOrdersUrl: 'https://www.sim2me.net/admin/orders',
    esimBalanceUsd: null,
  });
  await new Promise((r) => setTimeout(r, 800));
  const noBal = await latest();
  check('null balance renders a dash, not an error', /eSIMaccess Balance[\s\S]{0,200}—/.test(noBal));
  check('null balance is not flagged as low', !/low — top up/.test(noBal));
  check('admin email still shows the profit line', noBal.includes('$10.00'));

  // ── A healthy balance above the threshold is not flagged ───────────────────
  console.log('');
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await sendAdminOrderNotificationEmail({
    customerName: 'Balance Fine', customerEmail: 'y@example.com',
    packageName: 'Italy 5GB', destination: 'IT', dataAmount: '5 GB', validity: '30 days',
    amountCharged: 25, supplierCost: 15,
    orderId: 'y', orderNo: 'ord_test_0003',
    adminOrdersUrl: 'https://www.sim2me.net/admin/orders',
    esimBalanceUsd: 340.55,
  });
  await new Promise((r) => setTimeout(r, 800));
  const goodBal = await latest();
  check('healthy balance shows the figure', goodBal.includes('$340.55'));
  check('healthy balance is not flagged as low', !/low — top up/.test(goodBal));

  console.log(`\n${failures === 0 ? 'ALL BEHAVIOR CHECKS PASSED' : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
