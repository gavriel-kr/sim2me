/**
 * DB-backed rate limiting for serverless environments (no Redis required).
 * Uses the RateLimit model (key = "{ip}:{endpoint}") with a sliding window.
 */

import { prisma } from '@/lib/prisma';

/**
 * Check whether a request is within the allowed rate limit.
 * Returns true if the request is allowed, false if it should be rejected (429).
 */
export async function checkRateLimit(
  ip: string,
  endpoint: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  const key = `${ip}:${endpoint}`;
  const windowMs = windowSec * 1000;
  const now = new Date();

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing) {
      await prisma.rateLimit.create({ data: { key, count: 1, windowStart: now } });
      return true;
    }

    const elapsed = now.getTime() - existing.windowStart.getTime();

    if (elapsed > windowMs) {
      // Window expired — reset counter
      await prisma.rateLimit.update({ where: { key }, data: { count: 1, windowStart: now } });
      return true;
    }

    if (existing.count >= limit) {
      return false;
    }

    await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return true;
  } catch (e) {
    // On DB error, allow the request rather than blocking legitimate users
    console.error('[RateLimit] DB error:', e);
    return true;
  }
}

/** Extract client IP from request headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
