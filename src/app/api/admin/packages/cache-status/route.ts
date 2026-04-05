import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ALL_PACKAGES_DB_CACHE_KEY } from '@/lib/packagesCache';
import { requireAdmin } from '@/lib/session';

/**
 * GET /api/admin/packages/cache-status
 * Returns the current DB cache metadata: last updated timestamp and package count.
 * Admin-only.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: ALL_PACKAGES_DB_CACHE_KEY } });
    if (!setting) {
      return NextResponse.json({ ts: null, count: 0 });
    }
    const cached = JSON.parse(setting.value) as { ts: number; packageList: unknown[] };
    return NextResponse.json({ ts: cached.ts, count: cached.packageList?.length ?? 0 });
  } catch {
    return NextResponse.json({ ts: null, count: 0 });
  }
}
