import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const DEFAULT_FEE_SETTINGS_ID = 'default';

function isAdmin(session: unknown): boolean {
  return (session as { user?: { type?: string } })?.user?.type === 'admin';
}

/** GET current fee settings and additional fees. Admin only. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [feeSettings, additionalFees, esimAdditionalCostSetting] = await Promise.all([
    prisma.feeSettings.findFirst(),
    prisma.additionalFee.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.siteSetting.findUnique({ where: { key: 'esim_additional_cost' } }),
  ]);

  // Ensure default row exists (e.g. if migration ran but seed didn't)
  const settings = feeSettings ?? await prisma.feeSettings.upsert({
    where: { id: DEFAULT_FEE_SETTINGS_ID },
    update: {},
    create: {
      id: DEFAULT_FEE_SETTINGS_ID,
      paddlePercentageFee: new Prisma.Decimal(0.05),
      paddleFixedFee: new Prisma.Decimal(0.5),
      currency: 'USD',
    },
  });

  return NextResponse.json({
    feeSettings: {
      id: settings.id,
      paddlePercentageFee: Number(settings.paddlePercentageFee),
      paddleFixedFee: Number(settings.paddleFixedFee),
      currency: settings.currency,
    },
    esimAdditionalCost: esimAdditionalCostSetting ? parseFloat(esimAdditionalCostSetting.value) || 0 : 0,
    additionalFees: additionalFees.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type.toLowerCase() as 'fixed' | 'percentage',
      value: Number(f.value),
      isActive: f.isActive,
      appliesTo: f.appliesTo === 'ALL_PRODUCTS' ? 'all_products' : 'selected_products',
      selectedProductIds: f.selectedProductIds ? (JSON.parse(f.selectedProductIds) as string[]) : [],
      sortOrder: f.sortOrder,
    })),
  });
}

const feeTypeSchema = ['fixed', 'percentage'] as const;
const appliesToSchema = ['all_products', 'selected_products'] as const;

/** PUT update fee settings and/or additional fees. Admin only. */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: {
    feeSettings?: { paddlePercentageFee?: number; paddleFixedFee?: number; currency?: string };
    esimAdditionalCost?: number;
    additionalFees?: Array<{
      id?: string;
      name: string;
      type: string;
      value: number;
      isActive: boolean;
      appliesTo: string;
      selectedProductIds?: string[];
      sortOrder?: number;
    }>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate and update fee settings
  if (body.feeSettings) {
    const { paddlePercentageFee, paddleFixedFee, currency } = body.feeSettings;
    if (paddlePercentageFee != null) {
      if (typeof paddlePercentageFee !== 'number' || paddlePercentageFee < 0 || paddlePercentageFee > 1) {
        return NextResponse.json(
          { error: 'paddlePercentageFee must be a number between 0 and 1' },
          { status: 400 }
        );
      }
    }
    if (paddleFixedFee != null) {
      if (typeof paddleFixedFee !== 'number' || paddleFixedFee < 0) {
        return NextResponse.json(
          { error: 'paddleFixedFee must be a number >= 0' },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.feeSettings.findFirst();
    const id = existing?.id ?? DEFAULT_FEE_SETTINGS_ID;
    await prisma.feeSettings.upsert({
      where: { id },
      update: {
        ...(paddlePercentageFee != null && { paddlePercentageFee: new Prisma.Decimal(paddlePercentageFee) }),
        ...(paddleFixedFee != null && { paddleFixedFee: new Prisma.Decimal(paddleFixedFee) }),
        ...(currency != null && { currency: String(currency) }),
      },
      create: {
        id: DEFAULT_FEE_SETTINGS_ID,
        paddlePercentageFee: new Prisma.Decimal(paddlePercentageFee ?? 0.05),
        paddleFixedFee: new Prisma.Decimal(paddleFixedFee ?? 0.5),
        currency: currency ?? 'USD',
      },
    });
  }

  // Save eSIM additional cost adjustment (for test/manual purchases outside the app)
  if (body.esimAdditionalCost != null) {
    const val = typeof body.esimAdditionalCost === 'number' && body.esimAdditionalCost >= 0
      ? body.esimAdditionalCost
      : 0;
    await prisma.siteSetting.upsert({
      where: { key: 'esim_additional_cost' },
      create: { key: 'esim_additional_cost', value: String(val) },
      update: { value: String(val) },
    });
  }

  // Replace additional fees if provided
  if (Array.isArray(body.additionalFees)) {
    for (let i = 0; i < body.additionalFees.length; i++) {
      const f = body.additionalFees[i];
      if (typeof f.name !== 'string' || !f.name.trim()) {
        return NextResponse.json({ error: `additionalFees[${i}].name is required` }, { status: 400 });
      }
      if (!feeTypeSchema.includes(f.type as (typeof feeTypeSchema)[number])) {
        return NextResponse.json({ error: `additionalFees[${i}].type must be "fixed" or "percentage"` }, { status: 400 });
      }
      if (typeof f.value !== 'number' || f.value < 0) {
        return NextResponse.json({ error: `additionalFees[${i}].value must be a number >= 0` }, { status: 400 });
      }
      if (!appliesToSchema.includes(f.appliesTo as (typeof appliesToSchema)[number])) {
        return NextResponse.json({ error: `additionalFees[${i}].appliesTo must be "all_products" or "selected_products"` }, { status: 400 });
      }
      if (f.type === 'percentage' && f.value > 1) {
        return NextResponse.json({ error: `additionalFees[${i}].value (percentage) must be between 0 and 1` }, { status: 400 });
      }
    }

    await prisma.additionalFee.deleteMany({});
    await prisma.additionalFee.createMany({
      data: body.additionalFees.map((f, i) => ({
        name: f.name.trim(),
        type: f.type.toUpperCase() as 'FIXED' | 'PERCENTAGE',
        value: new Prisma.Decimal(f.value),
        isActive: Boolean(f.isActive),
        appliesTo: f.appliesTo === 'selected_products' ? 'SELECTED_PRODUCTS' : 'ALL_PRODUCTS',
        selectedProductIds: f.appliesTo === 'selected_products' && f.selectedProductIds?.length
          ? JSON.stringify(f.selectedProductIds)
          : null,
        sortOrder: typeof f.sortOrder === 'number' ? f.sortOrder : i,
      })),
    });
  }

  const [feeSettings, additionalFees, esimAdditionalCostSetting] = await Promise.all([
    prisma.feeSettings.findFirst(),
    prisma.additionalFee.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.siteSetting.findUnique({ where: { key: 'esim_additional_cost' } }),
  ]);

  const settings = feeSettings!;
  return NextResponse.json({
    feeSettings: {
      id: settings.id,
      paddlePercentageFee: Number(settings.paddlePercentageFee),
      paddleFixedFee: Number(settings.paddleFixedFee),
      currency: settings.currency,
    },
    esimAdditionalCost: esimAdditionalCostSetting ? parseFloat(esimAdditionalCostSetting.value) || 0 : 0,
    additionalFees: (additionalFees ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type.toLowerCase(),
      value: Number(f.value),
      isActive: f.isActive,
      appliesTo: f.appliesTo === 'ALL_PRODUCTS' ? 'all_products' : 'selected_products',
      selectedProductIds: f.selectedProductIds ? (JSON.parse(f.selectedProductIds) as string[]) : [],
      sortOrder: f.sortOrder,
    })),
  });
}
