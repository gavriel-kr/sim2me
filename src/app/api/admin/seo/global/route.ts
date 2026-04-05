import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { SEO_KEYS, GLOBAL_SEO_DEFAULTS, GLOBAL_SEO_CACHE_TAG, type SeoKeyName } from '@/lib/global-seo';
import { requireAdmin } from '@/lib/session';
import type { SiteSetting } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Object.values(SEO_KEYS) } },
  });
  const map = Object.fromEntries(rows.map((r: SiteSetting) => [r.key, r.value]));

  const settings: Record<string, string> = {};
  for (const [name, key] of Object.entries(SEO_KEYS) as [SeoKeyName, string][]) {
    settings[name] = map[key] ?? GLOBAL_SEO_DEFAULTS[name];
  }

  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await request.json();

  const ops = (Object.entries(SEO_KEYS) as [SeoKeyName, string][])
    .filter(([name]) => name in body)
    .map(([name, key]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: String(body[name] ?? '') },
        update: { value: String(body[name] ?? '') },
      })
    );

  await prisma.$transaction(ops);
  revalidateTag(GLOBAL_SEO_CACHE_TAG);

  return NextResponse.json({ success: true });
}
