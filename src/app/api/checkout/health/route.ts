/**
 * Checkout health check — measures each step of the checkout pipeline.
 * Hit this endpoint to diagnose where the 502 timeout originates.
 * GET /api/checkout/health
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDbCachedPackages } from '@/lib/packagesCache';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function timed<T>(label: string, fn: () => Promise<T>): Promise<{ label: string; ms: number; ok: boolean; error?: string; result?: string }> {
  const t = Date.now();
  try {
    const r = await fn();
    return { label, ms: Date.now() - t, ok: true, result: typeof r === 'object' && r !== null ? 'ok' : String(r) };
  } catch (e) {
    return { label, ms: Date.now() - t, ok: false, error: (e as Error).message?.slice(0, 200) };
  }
}

export async function GET() {
  const steps = await Promise.all([
    timed('db-ping', () => prisma.$queryRaw`SELECT 1` as Promise<unknown>),
    timed('rateLimit-read', () => prisma.rateLimit.findFirst()),
    timed('packageOverride-read', () => prisma.packageOverride.findFirst()),
    timed('packagesCache', () => getDbCachedPackages()),
    timed('paddle-ping', () =>
      fetch('https://api.paddle.com/customers?per_page=1', {
        headers: { Authorization: `Bearer ${process.env.PADDLE_API_KEY ?? 'none'}` },
        signal: AbortSignal.timeout(8000),
      }).then(r => ({ status: r.status }))
    ),
  ]);

  const totalMs = steps.reduce((sum, s) => sum + s.ms, 0);
  const allOk = steps.every(s => s.ok);

  return NextResponse.json({
    ok: allOk,
    totalMs,
    steps: steps.map(s => ({
      label: s.label,
      ms: s.ms,
      ok: s.ok,
      ...(s.error ? { error: s.error } : {}),
    })),
  });
}
