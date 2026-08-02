/**
 * Sends one real email and then asks Resend what happened to it.
 *
 * A 200 from the send endpoint only means Resend accepted the message; it says nothing about
 * whether a mailbox took it. This polls the email by id until it reports a terminal state, so a
 * pass here means delivered rather than merely sent.
 *
 * Usage: node agent-workspace/scripts/resend-smoke.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const env = {};
for (const line of fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const KEY = env.RESEND_API_KEY;
const FROM = env.RESEND_FROM_EMAIL;
const TO = env.ADMIN_NOTIFICATION_EMAIL;

if (!KEY || !FROM || !TO) {
  console.error('Missing RESEND_API_KEY / RESEND_FROM_EMAIL / ADMIN_NOTIFICATION_EMAIL');
  process.exit(1);
}

const stamp = new Date().toISOString();
const html = `<div style="font-family:sans-serif">
  <h2 style="color:#059669">Sim2Me — deliverability smoke test</h2>
  <p>If this reached your inbox, <strong>${FROM}</strong> is sending on a verified domain.</p>
  <p style="color:#64748b;font-size:13px">Sent ${stamp}</p>
</div>`;

const send = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: `Sim2Me <${FROM}>`,
    to: [TO],
    subject: 'Sim2Me — deliverability smoke test',
    html,
    text: `Sim2Me deliverability smoke test. Sent ${stamp}.`,
    reply_to: FROM,
  }),
});

const sent = await send.json().catch(() => null);
console.log('POST /emails ->', send.status, send.statusText);
if (!send.ok) {
  console.log(JSON.stringify(sent, null, 2));
  process.exit(1);
}

const id = sent.id;
console.log('email id:', id);
console.log(`from: ${FROM}   to: ${TO}`);
console.log('');

// Resend reports "queued" briefly before the receiving server answers.
const TERMINAL = new Set(['delivered', 'bounced', 'complained', 'failed', 'canceled']);
for (let i = 1; i <= 12; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const res = await fetch(`https://api.resend.com/emails/${id}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const info = await res.json().catch(() => null);
  const status = info?.last_event ?? 'unknown';
  console.log(`  [${String(i * 5).padStart(2)}s] ${status}`);
  if (TERMINAL.has(status)) {
    console.log('');
    console.log(status === 'delivered' ? 'PASS — the mailbox accepted it.' : `FAIL — ${status}`);
    process.exit(status === 'delivered' ? 0 : 1);
  }
}

console.log('');
console.log('Still not terminal after 60s. Check https://resend.com/emails/' + id);
