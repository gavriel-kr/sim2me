import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import {
  ensureTodayDeals,
  regenerateTodayDeals,
  getHotDealsConfig,
  utcDay,
  HOT_DEALS_CONFIG_KEY,
  type HotDealsConfig,
} from '@/lib/hot-deals';
import type { HotDeal } from '@prisma/client';

export const dynamic = 'force-dynamic';

/** GET — today's deals (all rows incl. disabled) + config */
export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  await ensureTodayDeals(); // lazily create today's set if missing
  const [deals, config] = await Promise.all([
    prisma.hotDeal.findMany({ where: { dealDay: utcDay() }, orderBy: { createdAt: 'asc' } }),
    getHotDealsConfig(),
  ]);

  return NextResponse.json({
    dealDay: utcDay(),
    config,
    deals: deals.map((d: HotDeal) => ({
      id: d.id,
      packageCode: d.packageCode,
      packageName: d.packageName,
      locationCode: d.locationCode,
      discountPercent: d.discountPercent,
      originalPrice: Number(d.originalPrice),
      dealPrice: Number(d.dealPrice),
      netProfit: Number(d.netProfit),
      pinned: d.pinned,
      active: d.active,
    })),
  });
}

/** PUT — update config */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = (await req.json()) as Partial<HotDealsConfig>;

  const current = await getHotDealsConfig();
  const next: HotDealsConfig = {
    enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
    count: clampInt(body.count, 1, 6, current.count),
    minProfit: clampNum(body.minProfit, 0, 1000, current.minProfit),
    discountMin: clampInt(body.discountMin, 1, 50, current.discountMin),
    discountMax: clampInt(body.discountMax, 1, 50, current.discountMax),
    minPrice: clampNum(body.minPrice, 0, 1000, current.minPrice),
  };
  if (next.discountMax < next.discountMin) next.discountMax = next.discountMin;

  await prisma.siteSetting.upsert({
    where: { key: HOT_DEALS_CONFIG_KEY },
    create: { key: HOT_DEALS_CONFIG_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });

  return NextResponse.json({ ok: true, config: next });
}

/** POST — actions: regenerate | toggle | pin */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = (await req.json()) as { action: string; id?: string };

  if (body.action === 'regenerate') {
    const deals = await regenerateTodayDeals();
    return NextResponse.json({ ok: true, count: deals.length });
  }

  if ((body.action === 'toggle' || body.action === 'pin') && body.id) {
    const deal = await prisma.hotDeal.findUnique({ where: { id: body.id } });
    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

    await prisma.hotDeal.update({
      where: { id: body.id },
      data: body.action === 'toggle' ? { active: !deal.active } : { pinned: !deal.pinned },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}
