/**
 * Ticket 042 — admin view of the day passes behind the "unlimited" tab.
 *
 * GET  → one row per destination: the 2GB/day pass the site sells there, its wholesale cost per
 *        day, and the retail price and profit at a few day counts. Hidden passes are listed too,
 *        with the pass that replaces them.
 * POST → hide or show one pass (a `PackageOverride` row on the eSIMaccess code, `visible` only).
 *        Hiding it makes the destination fall back to its next-best 2GB/day pass, or drop the tab.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { getDbCachedPackages } from '@/lib/packagesCache';
import { getPackages } from '@/lib/esimaccess';
import { pickDayPass, unlimitedCostUsd, unlimitedPriceUsd, fupKbps } from '@/lib/unlimited';

export const dynamic = 'force-dynamic';

const SAMPLE_DAYS = [1, 3, 7, 15, 30];

export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const cached = await getDbCachedPackages().catch(() => null);
  const list = cached?.packageList ?? (await getPackages().catch(() => ({ packageList: [] }))).packageList ?? [];
  const [overrides, fees] = await Promise.all([
    prisma.packageOverride.findMany({ where: { visible: false }, select: { packageCode: true } }),
    prisma.feeSettings.findFirst().catch(() => null),
  ]);
  const hidden = new Set<string>(overrides.map((o: { packageCode: string }) => o.packageCode));
  const pct = fees ? Number(fees.paddlePercentageFee) : 0.05;
  const fixed = fees ? Number(fees.paddleFixedFee) : 0.5;

  const locations = [...new Set(list.filter((p) => p.dataType === 2).map((p) => p.locationCode))];
  const rows = locations
    .map((code) => {
      const selling = pickDayPass(list, code, hidden);
      const best = pickDayPass(list, code);
      if (!best) return null;
      const shown = selling ?? best;
      const pkg = list.find((p) => p.packageCode === shown.packageCode);
      return {
        locationCode: code,
        location: pkg?.location ?? code,
        packageCode: shown.packageCode,
        name: pkg?.name ?? shown.packageCode,
        costPerDay: shown.costPerDayUsd,
        fupKbps: fupKbps(shown.fupPolicy),
        speed: shown.speed,
        /** The pass the site would sell if nothing were hidden, when it differs. */
        hiddenPass: selling && best.packageCode !== selling.packageCode ? best.packageCode : null,
        selling: Boolean(selling),
        samples: SAMPLE_DAYS.map((d) => {
          const price = unlimitedPriceUsd(shown.costPerDayUsd, d);
          const cost = unlimitedCostUsd(shown.costPerDayUsd, d);
          const profit = price - cost - (price * pct + fixed);
          return { days: d, price, cost, profit: Math.round(profit * 100) / 100 };
        }),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.location.localeCompare(b!.location));

  return NextResponse.json({ rows, hiddenCodes: [...hidden] });
}

const bodySchema = z.object({ packageCode: z.string().min(1).max(128), visible: z.boolean() });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { packageCode, visible } = parsed.data;

  await prisma.packageOverride.upsert({
    where: { packageCode },
    create: { packageCode, visible },
    update: { visible },
  });
  createAuditLog({
    adminEmail: session!.user!.email!,
    adminName: session!.user!.name ?? '',
    action: visible ? 'SHOW_DAY_PASS' : 'HIDE_DAY_PASS',
    targetType: 'PackageOverride',
    targetId: packageCode,
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
