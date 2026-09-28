/**
 * Ticket 042 — admin view of PikaSim phone plans.
 *
 * GET  → every plan with cost, rule price, current price, market reference, visibility and why,
 *        plus the PikaSim wallet balance and the fee settings the profit column uses.
 *        `?refresh=1` drops the in-memory catalogue first.
 * POST → save or reset one plan's override. Overrides live in `PackageOverride` under `pk:<code>`;
 *        "reset" deletes the row so the plan falls back to the pricing and visibility rules.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { clearPhoneCatalogCache, getPikaAccount, isPikaSimConfigured } from '@/lib/pikasim';
import { getPhonePlans } from '@/lib/phone-catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  if (!isPikaSimConfigured()) {
    return NextResponse.json({ configured: false, plans: [], balance: null });
  }
  if (new URL(request.url).searchParams.get('refresh') === '1') clearPhoneCatalogCache();

  const [plans, account, fees] = await Promise.all([
    getPhonePlans(),
    getPikaAccount().catch(() => null),
    prisma.feeSettings.findFirst().catch(() => null),
  ]);

  return NextResponse.json({
    configured: true,
    plans,
    balance: account ? account.balance / 100 : null,
    accountStatus: account?.status ?? null,
    fees: {
      percentageFee: fees ? Number(fees.paddlePercentageFee) : 0.05,
      fixedFee: fees ? Number(fees.paddleFixedFee) : 0.5,
    },
  });
}

const bodySchema = z.object({
  code: z.string().min(1).max(120),
  action: z.enum(['save', 'reset']),
  visible: z.boolean().optional(),
  customPrice: z.number().positive().max(10000).nullable().optional(),
  customTitle: z.string().max(200).nullable().optional(),
  saleBadge: z.string().max(40).nullable().optional(),
  featured: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { code, action } = parsed.data;
  const packageCode = `pk:${code}`;

  if (action === 'reset') {
    await prisma.packageOverride.deleteMany({ where: { packageCode } });
  } else {
    const data = {
      visible: parsed.data.visible ?? true,
      customPrice: parsed.data.customPrice ?? null,
      customTitle: parsed.data.customTitle?.trim() || null,
      saleBadge: parsed.data.saleBadge?.trim() || null,
      featured: parsed.data.featured ?? false,
    };
    await prisma.packageOverride.upsert({ where: { packageCode }, create: { packageCode, ...data }, update: data });
  }

  createAuditLog({
    adminEmail: session!.user!.email!,
    adminName: session!.user!.name ?? '',
    action: action === 'reset' ? 'RESET_PHONE_PLAN_OVERRIDE' : 'UPSERT_PHONE_PLAN_OVERRIDE',
    targetType: 'PackageOverride',
    targetId: packageCode,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
