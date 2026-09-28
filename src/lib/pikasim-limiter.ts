/**
 * Keeps every server instance, together, under PikaSim's API limit.
 *
 * PikaSim allows 60 requests a minute per API key and automatically suspends a key that keeps going
 * past it. On 2026-09-28 a loop on the customer account page sent about 1,200 requests in four
 * minutes and the reseller account was suspended. This module is the second line of defence: even if
 * something upstream misbehaves again, PikaSim never sees more than a trickle.
 *
 *  - Site-wide: a per-minute counter in the database (`rate_limits`, atomic upsert), shared by all
 *    instances, capped well below PikaSim's 60.
 *  - Per instance: the same idea in memory, for when the database cannot be reached.
 *  - Pauses: PikaSim's `429` (with `Retry-After`), its `X-RateLimit-Remaining` / `X-RateLimit-Reset`
 *    headers, and a suspended or rejected key all stop every instance from calling until the pause
 *    ends. A request held back here never reaches PikaSim.
 */

import { prisma } from '@/lib/prisma';

/** PikaSim allows 60/min; everything we send across all instances stays under this. */
export const SITE_LIMIT_PER_MINUTE = 40;
/** One instance on its own, in case the shared counter is unreachable. */
export const INSTANCE_LIMIT_PER_MINUTE = 20;
const DEFAULT_PAUSE_MS = 60_000;
/** A suspended or rejected key: keep traffic near zero while it is being reviewed. */
const KEY_PROBLEM_PAUSE_MS = 10 * 60_000;
const MAX_PAUSE_MS = 15 * 60_000;
const PAUSE_KEY = 'pikasim-pause';
const MINUTE_PREFIX = 'pikasim-minute:';

let pausedUntil = 0;
const recent: number[] = [];

function sharedCounterEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * `X-RateLimit-Reset`: PikaSim's docs call it a "reset timestamp" without a unit, so accept Unix
 * seconds, Unix milliseconds, or seconds from now.
 */
export function parseResetMs(value: string | null, now = Date.now()): number | null {
  if (!value) return null;
  const n = Number(value.trim());
  if (!Number.isFinite(n) || n < 0) return null;
  if (n > 1e12) return n;
  if (n > 1e9) return n * 1000;
  return now + n * 1000;
}

/** `Retry-After`: seconds, or an HTTP date. */
export function parseRetryAfterMs(value: string | null, now = Date.now()): number | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d+(\.\d+)?$/.test(v)) return now + Number(v) * 1000;
  const date = Date.parse(v);
  return Number.isNaN(date) ? null : date;
}

/** Stop every instance from calling PikaSim until `untilMs` (clamped to a sane range). */
export async function pauseUntil(untilMs: number, now = Date.now()): Promise<void> {
  const until = Math.min(Math.max(untilMs, now + 1000), now + MAX_PAUSE_MS);
  if (until > pausedUntil) pausedUntil = until;
  if (!sharedCounterEnabled()) return;
  try {
    const at = new Date(until);
    await prisma.rateLimit.upsert({
      where: { key: PAUSE_KEY },
      create: { key: PAUSE_KEY, count: 0, windowStart: at },
      update: { windowStart: at },
    });
  } catch (e) {
    console.warn('[pikasim-limiter] could not share the pause', e instanceof Error ? e.message : e);
  }
}

/**
 * Take one request slot. Returns null when the call may go ahead, or why it is held back.
 * A held-back call must not be retried straight away: the caller treats it like a 429.
 */
export async function takeSlot(now = Date.now()): Promise<string | null> {
  if (now < pausedUntil) return 'paused after a rate-limit answer';

  while (recent.length && now - recent[0] >= 60_000) recent.shift();
  if (recent.length >= INSTANCE_LIMIT_PER_MINUTE) return 'instance limit reached';

  if (sharedCounterEnabled()) {
    try {
      const pause = await prisma.rateLimit.findUnique({ where: { key: PAUSE_KEY } });
      if (pause && pause.windowStart.getTime() > now) {
        pausedUntil = Math.max(pausedUntil, pause.windowStart.getTime());
        return 'paused (shared)';
      }
      const key = `${MINUTE_PREFIX}${Math.floor(now / 60_000)}`;
      const row = await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart: new Date(now) },
        update: { count: { increment: 1 } },
      });
      // Old minute counters are useless after the minute; sweep them now and then.
      if (Math.random() < 0.05) {
        prisma.rateLimit
          .deleteMany({ where: { key: { startsWith: MINUTE_PREFIX }, windowStart: { lt: new Date(now - 3_600_000) } } })
          .catch(() => {});
      }
      if (row.count > SITE_LIMIT_PER_MINUTE) return 'site-wide limit reached';
    } catch (e) {
      // The in-memory limit above still applies; do not block fulfilment on a database hiccup.
      console.warn('[pikasim-limiter] shared counter unavailable', e instanceof Error ? e.message : e);
    }
  }

  recent.push(now);
  return null;
}

/** Read PikaSim's answer for anything that means "slow down" or "stop". */
export async function noteResponse(status: number, headers: Headers, errorText = '', now = Date.now()): Promise<void> {
  if (status === 429) {
    const until =
      parseRetryAfterMs(headers.get('retry-after'), now) ??
      parseResetMs(headers.get('x-ratelimit-reset'), now) ??
      now + DEFAULT_PAUSE_MS;
    await pauseUntil(until, now);
    return;
  }
  if (status === 401 || (status === 403 && /suspend|disabled|revoked|inactive|blocked/i.test(errorText))) {
    await pauseUntil(now + KEY_PROBLEM_PAUSE_MS, now);
    return;
  }
  const remaining = headers.get('x-ratelimit-remaining')?.trim();
  if (remaining && Number.isFinite(Number(remaining)) && Number(remaining) <= 1) {
    await pauseUntil(parseResetMs(headers.get('x-ratelimit-reset'), now) ?? now + DEFAULT_PAUSE_MS, now);
  }
}

/** For tests only. */
export function resetLimiterForTests(): void {
  pausedUntil = 0;
  recent.length = 0;
}
