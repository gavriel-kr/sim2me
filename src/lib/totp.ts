/**
 * TOTP (RFC 6238) implementation using Node.js built-in crypto only.
 * No external dependencies — works in all serverless environments.
 */

import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Generate a random 20-byte base32-encoded TOTP secret */
export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  let result = '';
  let bits = 0;
  let value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += ALPHABET[(value << (5 - bits)) & 31];
  return result;
}

/** Build the otpauth:// URL for QR code scanning */
export function buildOtpauthUrl(email: string, issuer: string, secret: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/** Decode a base32 string to a Buffer */
function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of clean) {
    const idx = ALPHABET.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Generate a single HOTP code for the given counter */
function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.allocUnsafe(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const digest = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, '0');
}

/**
 * Verify a 6-digit TOTP token against a secret.
 * Accepts current window ±1 (90-second drift tolerance).
 */
export function verifyTotp(token: string, secret: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const t = Math.floor(Date.now() / 1000 / 30);
  for (let i = -1; i <= 1; i++) {
    if (hotp(secret, t + i) === token) return true;
  }
  return false;
}
