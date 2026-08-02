/**
 * Reads the local .env and reports what Resend actually thinks, rather than what we hope.
 *
 * Prints the sending configuration with the API key masked, then asks Resend which domains the key
 * can see and whether they are verified. Run before sending any test batch: a key that works and a
 * domain that is verified are two different facts, and only the second one keeps mail out of spam.
 *
 * Usage: node agent-workspace/scripts/resend-status.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('No .env at', envPath);
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const mask = (v) => (v ? `${v.slice(0, 6)}...${v.slice(-3)}  [len ${v.length}]` : 'MISSING');

console.log('── local sending config ──────────────────────────────');
console.log('RESEND_API_KEY           =', mask(env.RESEND_API_KEY));
console.log('RESEND_FROM_EMAIL        =', env.RESEND_FROM_EMAIL || 'MISSING');
console.log('ADMIN_NOTIFICATION_EMAIL =', env.ADMIN_NOTIFICATION_EMAIL || 'MISSING');
console.log('NEXT_PUBLIC_SITE_URL     =', env.NEXT_PUBLIC_SITE_URL || 'MISSING');
console.log('');

if (!env.RESEND_API_KEY) process.exit(1);

const res = await fetch('https://api.resend.com/domains', {
  headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
});

console.log('── resend /domains ───────────────────────────────────');
console.log('HTTP', res.status, res.statusText);

const body = await res.json().catch(() => null);
if (!res.ok) {
  console.log(JSON.stringify(body, null, 2));
  process.exit(1);
}

const domains = body?.data ?? [];
if (!domains.length) {
  console.log('(this key sees no domains — sending is limited to the account owner address)');
} else {
  for (const d of domains) {
    console.log(`  ${d.name}  status=${d.status}  region=${d.region}  created=${d.created_at}`);
  }
}

// The from address is only usable if its domain is verified on this key's account.
const fromDomain = (env.RESEND_FROM_EMAIL || '').split('@')[1];
const match = domains.find((d) => d.name === fromDomain);
console.log('');
console.log('── verdict ───────────────────────────────────────────');
if (!fromDomain) {
  console.log('FAIL  RESEND_FROM_EMAIL is not set to an address.');
} else if (!match) {
  console.log(`FAIL  "${fromDomain}" is not on this account. Every send will be rejected.`);
} else if (match.status !== 'verified') {
  console.log(`WAIT  "${fromDomain}" is "${match.status}", not verified. Click Verify DNS Records.`);
} else {
  console.log(`OK    "${fromDomain}" is verified. Mail can go to any recipient.`);
}
