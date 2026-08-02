/**
 * Reports what Resend recorded for the most recent sends.
 *
 * Written after finding that a 200 on send had been hiding months of rejected mail: the only
 * trustworthy answer to "did the customer get it" comes from the provider's own log, so this reads
 * that log rather than anything we remember doing.
 *
 * Usage: node agent-workspace/scripts/resend-delivery-report.mjs [limit]
 */
import fs from 'node:fs';
import path from 'node:path';

const env = {};
for (const line of fs.readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const KEY = env.RESEND_API_KEY;
if (!KEY) {
  console.error('RESEND_API_KEY is not set.');
  process.exit(1);
}

const limit = Number(process.argv[2] ?? 30);
const res = await fetch(`https://api.resend.com/emails?limit=${limit}`, {
  headers: { Authorization: `Bearer ${KEY}` },
});

if (!res.ok) {
  console.error('HTTP', res.status, await res.text());
  process.exit(1);
}

const { data = [] } = await res.json();
if (!data.length) {
  console.log('No emails recorded.');
  process.exit(0);
}

const tally = new Map();
console.log(`${data.length} most recent sends\n`);

for (const e of data) {
  const status = e.last_event ?? 'unknown';
  tally.set(status, (tally.get(status) ?? 0) + 1);
  const when = new Date(e.created_at).toISOString().slice(11, 19);
  const subject = (e.subject ?? '').slice(0, 52);
  console.log(`  ${when}  ${status.padEnd(10)} ${String(e.to).padEnd(24)} ${subject}`);
}

console.log('\n── tally ───────────────────────────');
for (const [status, n] of [...tally].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${status.padEnd(12)} ${n}`);
}

const bad = [...tally].filter(([s]) => s !== 'delivered' && s !== 'sent');
console.log('');
console.log(bad.length ? `ATTENTION: ${bad.map(([s, n]) => `${n} ${s}`).join(', ')}` : 'All accounted for.');
