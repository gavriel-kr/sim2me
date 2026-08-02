/**
 * Ticket 033 — did any customer email ever actually arrive?
 *
 * Cross-references every order in the database against the full send history on the Resend account
 * production uses. Written because the preview work turned up a `from` address of
 * `onboarding@resend.dev` on real post-purchase sends, which should not have been possible if the
 * site were configured with a verified domain.
 *
 *   node agent-workspace/scripts/ticket-033-delivery-audit.mjs
 */
import { config } from 'dotenv';
config();

const key = process.env.RESEND_API_KEY;
if (!key) {
  console.error('RESEND_API_KEY not set');
  process.exit(1);
}

const res = await fetch('https://api.resend.com/emails?limit=100', {
  headers: { Authorization: `Bearer ${key}` },
});
const { data: sent = [] } = await res.json();

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const orders = await prisma.order.findMany({
  where: { status: 'COMPLETED' },
  select: { orderNo: true, customerEmail: true, createdAt: true, source: true },
  orderBy: { createdAt: 'asc' },
});
await prisma.$disconnect();

const recipients = new Set(sent.flatMap((e) => e.to ?? []));
const senders = new Set(sent.map((e) => e.from));
const customers = [...new Set(orders.map((o) => o.customerEmail))];
const reached = customers.filter((c) => recipients.has(c));
const unreached = customers.filter((c) => !recipients.has(c));

console.log('── Resend account ──────────────────────────────');
console.log(`send records available   ${sent.length}`);
console.log(`oldest record            ${sent.at(-1)?.created_at ?? 'n/a'}`);
console.log(`distinct recipients ever ${recipients.size}`);
[...recipients].forEach((r) => console.log(`  → ${r}`));
console.log(`distinct senders ever    ${senders.size}`);
[...senders].forEach((s) => console.log(`  ← ${s}`));

console.log('\n── Orders ──────────────────────────────────────');
console.log(`completed orders         ${orders.length}`);
console.log(`distinct customers       ${customers.length}`);
console.log(`customers ever emailed   ${reached.length}`);
console.log(`customers NEVER emailed  ${unreached.length}`);
unreached.forEach((c) => {
  const theirs = orders.filter((o) => o.customerEmail === c);
  console.log(`  ✗ ${c}  (${theirs.length} paid order${theirs.length === 1 ? '' : 's'}, first ${theirs[0].createdAt.toISOString().slice(0, 10)})`);
});

const verifiedSender = [...senders].some((s) => /@sim2me\.net/i.test(s));
console.log('\n── Verdict ─────────────────────────────────────');
console.log(verifiedSender
  ? 'At least one email was sent from an @sim2me.net address.'
  : 'No email was EVER sent from @sim2me.net — every send used the Resend sandbox sender,');
if (!verifiedSender) {
  console.log('which can only deliver to the account owner. Customer mail is being rejected 403');
  console.log('and swallowed by the catch in sendEmail, so orders complete and nobody is told.');
}
