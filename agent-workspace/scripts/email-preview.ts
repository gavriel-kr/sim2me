/**
 * Ticket 033 — render or send every customer-facing email, in every language.
 *
 * Goes through the real `src/lib/email.ts` functions rather than a parallel set of render helpers,
 * so what you look at is what a customer would receive. `EMAIL_PREVIEW_DIR` diverts the send to
 * disk; without it the same call sends for real.
 *
 * It lives here rather than as a route under `src/` on purpose: DEPLOY-READINESS records the
 * existing `design-preview` page as a standing hazard because one `git add -A` puts it on the live
 * site. A script in the workspace cannot be deployed by accident.
 *
 *   npx tsx agent-workspace/scripts/email-preview.ts --write
 *   npx tsx agent-workspace/scripts/email-preview.ts --send you@example.com
 */
import { config } from 'dotenv';
import { join } from 'node:path';
import { writeFile, mkdir, readdir, rm } from 'node:fs/promises';

config();

const OUT_DIR = join(process.cwd(), 'agent-workspace/tickets/033-email-overhaul/proofs/emails');
const LOCALES = ['he', 'en', 'ar'] as const;

async function main() {
  const args = process.argv.slice(2);
  const wantsWrite = args.includes('--write');
  const sendIdx = args.indexOf('--send');
  const sendTo = sendIdx >= 0 ? args[sendIdx + 1] : null;

  if (!wantsWrite && !sendTo) {
    console.error('Usage: --write  |  --send <address>');
    process.exit(1);
  }

  if (wantsWrite) {
    process.env.EMAIL_PREVIEW_DIR = OUT_DIR;
    // Purge first: a subject line change renames the file, and the previous run's copy would sit
    // beside the new one looking equally current.
    await rm(OUT_DIR, { recursive: true, force: true });
    await mkdir(OUT_DIR, { recursive: true });
  } else {
    delete process.env.EMAIL_PREVIEW_DIR;
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set — nothing would actually be sent.');
      process.exit(1);
    }
  }

  // Imported after the env var is set. `email.ts` reads it per call, so the order is not strictly
  // required, but it keeps the intent obvious reading top to bottom.
  const {
    sendPostPurchaseEmail,
    sendOrderDelayedEmail,
    sendPasswordResetEmail,
    sendVerificationEmail,
    sendOtpEmail,
    sendAdminOrderNotificationEmail,
    // Ticket 026 — the contact auto-reply joins the matrix, in all three languages.
    sendContactAutoReplyEmail,
    sendContactAdminNotificationEmail,
  } = await import('../../src/lib/email');
  const { PrismaClient } = await import('@prisma/client');

  /*
    Fixture built from a real completed order when the database has one.

    A made-up QR URL would exercise neither the remote image nor the attachment fetch, and those are
    two of the things this ticket changed and two of the things most likely to be wrong.
  */
  const prisma = new PrismaClient();
  const real = await prisma.order.findFirst({
    where: { status: 'COMPLETED', qrCodeUrl: { not: null }, iccid: { not: null } },
    orderBy: { createdAt: 'desc' },
  });
  await prisma.$disconnect();

  console.log(
    real
      ? `Fixture: real order ${real.orderNo} — ${real.packageName}\n`
      : 'No completed order with a QR found — using synthetic data\n',
  );

  const purchase = {
    customerName: 'Gabriel Kramer',
    planName: real?.packageName ?? 'Europe 30 Countries — 5GB',
    dataGb: real?.dataAmount ?? '5 GB',
    validityDays: real?.validity ?? '30 days',
    qrCodeUrl: real?.qrCodeUrl ?? null,
    smdpAddress: real?.smdpAddress ?? 'rsp.truphone.com',
    activationCode: real?.activationCode ?? 'K2-1AB3CD-4EF5GH',
    email: 'traveler@example.com',
    tempPassword: 'Sx7Qm2Kd91',
    orderNo: real?.orderNo ?? 'cmsc2ewst000lx1il654k3mbm',
    destination: real?.destination ?? 'Europe',
    amountPaid: real ? Number(real.totalAmount) : 24.9,
    currency: real?.currency ?? 'USD',
    orderDate: real?.paidAt ?? real?.createdAt ?? new Date(),
    iccid: real?.iccid ?? '8944478000001234567',
  };

  const recipient = sendTo ?? 'preview@sim2me.net';
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net').replace(/\/$/, '');

  // `destination` stays on the fixture for the admin email, which still shows it.
  const { destination: _dest, ...customerPurchase } = purchase;

  for (const locale of LOCALES) {
    await sendPostPurchaseEmail(recipient, { ...customerPurchase, loginLink: `${base}/${locale}/account` }, locale);

    await sendOrderDelayedEmail(recipient, {
      customerName: purchase.customerName,
      orderNo: purchase.orderNo,
      planName: purchase.planName,
      amountPaid: purchase.amountPaid,
      currency: purchase.currency,
      accountLink: `${base}/${locale}/account`,
    }, locale);

    await sendPasswordResetEmail(recipient, 'preview-reset-token-0000', locale);
    await sendVerificationEmail(recipient, 'preview-verify-token-0000', locale);
    await sendOtpEmail(recipient, '482913', locale);

    await sendContactAutoReplyEmail(recipient, {
      customerName: purchase.customerName,
      ref: 'SM-4KD91Z',
      subject: 'Installation Help',
    }, locale);
  }

  sendContactAdminNotificationEmail({
    name: purchase.customerName,
    email: purchase.email,
    phone: '+972501234567',
    subject: 'Activation Issue',
    message: 'Scanned the QR in Rome and it says no service.',
    ref: 'SM-4KD91Z',
    urgent: true,
    marketingConsent: true,
  });

  // Admin only. Included so the wallet balance can be eyeballed in the one place it is allowed to
  // appear — and so its absence everywhere else is visible by comparison.
  await sendAdminOrderNotificationEmail({
    customerName: purchase.customerName,
    customerEmail: purchase.email,
    packageName: purchase.planName,
    destination: purchase.destination,
    dataAmount: purchase.dataGb,
    validity: purchase.validityDays,
    amountCharged: purchase.amountPaid,
    supplierCost: 14.2,
    orderId: real?.id ?? 'preview',
    orderNo: purchase.orderNo,
    adminOrdersUrl: `${base}/admin/orders`,
    esimBalanceUsd: 12.4, // deliberately under the alert threshold, to show the warning state
  });

  // That one is fire-and-forget by design; give its send a moment to land.
  await new Promise((r) => setTimeout(r, 2000));

  if (wantsWrite) {
    await writeIndex();
  } else {
    console.log(`\nSent every template to ${sendTo}`);
  }
}

async function writeIndex() {
  const files = (await readdir(OUT_DIR)).filter((f) => f.endsWith('.html') && f !== 'index.html').sort();
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Sim2Me email previews</title>
<style>
 body{font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:32px;color:#0f172a}
 h1{font-size:20px;margin:0 0 4px}
 p.sub{color:#64748b;margin:0 0 24px;font-size:14px}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:20px}
 .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
 .card h2{font-size:12px;margin:0;padding:10px 14px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;font-weight:600;word-break:break-all}
 iframe{width:100%;height:560px;border:0;display:block;background:#fff}
</style></head>
<body>
<h1>Sim2Me — every email, every language</h1>
<p class="sub">${files.length} rendered from the live templates. Ticket 033.</p>
<div class="grid">
${files.map((f) => `<div class="card"><h2>${f.replace(/\.html$/, '')}</h2><iframe src="./${encodeURIComponent(f)}"></iframe></div>`).join('\n')}
</div>
</body></html>`;
  await writeFile(join(OUT_DIR, 'index.html'), html, 'utf8');
  console.log(`\n${files.length} emails written to ${OUT_DIR}`);
  console.log(`Open: ${join(OUT_DIR, 'index.html')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
