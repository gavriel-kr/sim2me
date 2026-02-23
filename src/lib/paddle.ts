/**
 * Paddle Billing: webhook signature verification (HMAC-SHA256).
 * Prevents spoofing and man-in-the-middle. Verify every webhook before processing.
 * @see https://developer.paddle.com/webhooks/signature-verification
 */

import { createHmac, timingSafeEqual } from 'crypto';

const PADDLE_SIGNATURE_HEADER = 'paddle-signature';
const TS_TOLERANCE_SEC = 5;

export interface ParsedSignature {
  ts: number;
  h1: string;
}

/**
 * Parse Paddle-Signature header: "ts=1671552777;h1=eb4d0dc8..."
 */
export function parsePaddleSignature(header: string | null | undefined): ParsedSignature | null {
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(';');
  let ts: number | null = null;
  let h1: string | null = null;
  for (const part of parts) {
    const [key, value] = part.trim().split('=');
    if (key === 'ts' && value) ts = parseInt(value, 10);
    if (key === 'h1' && value) h1 = value;
  }
  if (ts == null || !h1) return null;
  return { ts, h1 };
}

/**
 * Verify Paddle webhook signature using HMAC-SHA256 and endpoint secret.
 * Rejects if signature missing, invalid, or timestamp too old (replay protection).
 */
export function verifyPaddleWebhook(
  rawBody: Buffer | string,
  signatureHeader: string | null | undefined,
  secret: string
): boolean {
  if (!secret) return false;
  const parsed = parsePaddleSignature(signatureHeader);
  if (!parsed) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.ts) > TS_TOLERANCE_SEC) return false;

  const body = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
  const signedPayload = `${parsed.ts}:${body.toString('utf8')}`;
  const expected = createHmac('sha256', secret).update(signedPayload).digest('hex');

  if (expected.length !== parsed.h1.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(parsed.h1, 'hex'));
  } catch {
    return false;
  }
}

/** Safe parse JSON; returns null on invalid. */
export function safeJsonParse<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
