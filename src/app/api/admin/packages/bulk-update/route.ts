import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPackages } from '@/lib/esimaccess';
import { computeProfit, computeOtherFeesTotal, type AdditionalFeeItem } from '@/lib/profit';
import type { BulkUpdatePayload, RollbackSnapshotItem } from '@/lib/bulk-edit-types';
import { BULK_UPDATE_CHUNK_SIZE } from '@/lib/bulk-edit-types';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

function isAdmin(session: unknown): boolean {
  return (session as { user?: { type?: string } })?.user?.type === 'admin';
}

function applyNumericEdit(current: number, mode: string, value: number): number {
  switch (mode) {
    case 'set_exact':
      return value;
    case 'increase_percent':
      return current * (1 + value / 100);
    case 'decrease_percent':
      return current * (1 - value / 100);
    case 'increase_fixed':
      return current + value;
    case 'decrease_fixed':
      return Math.max(0, current - value);
    default:
      return current;
  }
}

/** POST — bulk update package overrides. Transaction-safe, chunked, logged with rollback snapshot. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const adminId = (session.user as { id?: string }).id;
  if (!adminId) return NextResponse.json({ error: 'Admin ID missing' }, { status: 401 });

  let body: BulkUpdatePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { packageCodes, edits, conditions } = body;
  if (!Array.isArray(packageCodes) || packageCodes.length === 0) {
    return NextResponse.json({ error: 'packageCodes must be a non-empty array' }, { status: 400 });
  }
  if (!edits || typeof edits !== 'object') {
    return NextResponse.json({ error: 'edits object required' }, { status: 400 });
  }

  const hasAnyEdit =
    edits.retailPrice ||
    edits.simCost ||
    edits.saleBadge ||
    edits.notes ||
    edits.paddlePriceId;
  if (!hasAnyEdit) {
    return NextResponse.json({ error: 'At least one edit field required' }, { status: 400 });
  }

  // Load fee settings (no hardcoded fees)
  const [feeSettingsRow, additionalFeesRows, existingOverrides, packagesResult] = await Promise.all([
    prisma.feeSettings.findFirst(),
    prisma.additionalFee.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.packageOverride.findMany({ where: { packageCode: { in: packageCodes } } }),
    getPackages(),
  ]);

  if (!feeSettingsRow) {
    return NextResponse.json({ error: 'Fee settings not configured. Configure in Admin → Fees / Charges.' }, { status: 400 });
  }

  const paddlePercentageFee = Number(feeSettingsRow.paddlePercentageFee);
  const paddleFixedFee = Number(feeSettingsRow.paddleFixedFee);
  const additionalFees: AdditionalFeeItem[] = additionalFeesRows.map((f) => ({
    type: f.type === 'FIXED' ? 'fixed' : 'percentage',
    value: Number(f.value),
    isActive: f.isActive,
    appliesTo: f.appliesTo === 'ALL_PRODUCTS' ? 'all_products' : 'selected_products',
    selectedProductIds: f.selectedProductIds ? (JSON.parse(f.selectedProductIds) as string[]) : [],
  }));

  const packageList = packagesResult.packageList || [];
  const packageMap = new Map(packageList.map((p) => [p.packageCode, p]));
  const overrideMap = new Map(existingOverrides.map((o) => [o.packageCode, o]));

  const rollbackSnapshot: RollbackSnapshotItem[] = [];
  const updates: {
    packageCode: string;
    visible: boolean;
    customTitle: string | null;
    customPrice: number | null;
    simCost: number | null;
    paddlePriceId: string | null;
    saleBadge: string | null;
    featured: boolean;
    sortOrder: number;
    notes: string | null;
  }[] = [];

  for (const packageCode of packageCodes) {
    const pkg = packageMap.get(packageCode);
    if (!pkg) continue; // skip if not in API

    const existing = overrideMap.get(packageCode);
    const currentRetail =
      existing?.customPrice != null
        ? Number(existing.customPrice)
        : (pkg.retailPrice ?? pkg.price) / 10000;
    const currentSimCost =
      existing?.simCost != null ? Number(existing.simCost) : pkg.price / 10000;

    // Conditions: if any condition fails, skip this package
    if (conditions) {
      if (conditions.countryEquals != null && pkg.locationCode !== conditions.countryEquals) continue;
      if (conditions.durationEquals != null && pkg.duration !== conditions.durationEquals) continue;
      if (conditions.dataAmountEquals != null) {
        const dataGb = pkg.volume / (1024 * 1024 * 1024);
        if (Math.abs(dataGb - conditions.dataAmountEquals) > 0.01) continue;
      }
      if (
        conditions.retailPriceMin != null &&
        currentRetail < conditions.retailPriceMin
      )
        continue;
      if (
        conditions.retailPriceMax != null &&
        currentRetail > conditions.retailPriceMax
      )
        continue;

      if (
        conditions.marginLessThan != null ||
        conditions.marginGreaterThan != null ||
        conditions.netProfitLessThan != null ||
        conditions.netProfitGreaterThan != null
      ) {
        const other = computeOtherFeesTotal(currentRetail, additionalFees, packageCode);
        const profit = computeProfit({
          salePrice: currentRetail,
          simCost: currentSimCost,
          percentageFee: paddlePercentageFee,
          fixedFee: paddleFixedFee,
          otherFeesTotal: other,
        });
        const marginPct = profit.profitMargin * 100;
        if (
          conditions.marginLessThan != null &&
          marginPct >= conditions.marginLessThan
        )
          continue;
        if (
          conditions.marginGreaterThan != null &&
          marginPct <= conditions.marginGreaterThan
        )
          continue;
        if (
          conditions.netProfitLessThan != null &&
          profit.netProfit >= conditions.netProfitLessThan
        )
          continue;
        if (
          conditions.netProfitGreaterThan != null &&
          profit.netProfit <= conditions.netProfitGreaterThan
        )
          continue;
      }
    }

    // Rollback snapshot: state before update
    rollbackSnapshot.push({
      packageCode,
      override: existing
        ? {
            visible: existing.visible,
            customTitle: existing.customTitle,
            customPrice: existing.customPrice != null ? Number(existing.customPrice) : null,
            simCost: existing.simCost != null ? Number(existing.simCost) : null,
            paddlePriceId: existing.paddlePriceId,
            saleBadge: existing.saleBadge,
            featured: existing.featured,
            sortOrder: existing.sortOrder,
            notes: existing.notes,
          }
        : null,
    });

    // Apply edits
    let newRetail = currentRetail;
    let newSimCost = currentSimCost;
    if (edits.retailPrice) {
      newRetail = applyNumericEdit(
        currentRetail,
        edits.retailPrice.mode,
        edits.retailPrice.value
      );
      newRetail = Math.round(newRetail * 100) / 100;
    }
    if (edits.simCost) {
      newSimCost = applyNumericEdit(
        currentSimCost,
        edits.simCost.mode,
        edits.simCost.value
      );
      newSimCost = Math.round(newSimCost * 10000) / 10000;
    }

    const newSaleBadge =
      edits.saleBadge !== undefined
        ? edits.saleBadge.mode === 'set_exact'
          ? edits.saleBadge.value
          : (existing?.saleBadge ?? null)
        : (existing?.saleBadge ?? null);
    const newNotes =
      edits.notes !== undefined
        ? edits.notes.mode === 'set_exact'
          ? edits.notes.value
          : (existing?.notes ?? null)
        : (existing?.notes ?? null);
    const newPaddlePriceId =
      edits.paddlePriceId !== undefined
        ? edits.paddlePriceId.mode === 'set_exact'
          ? (edits.paddlePriceId.value?.trim() || null)
          : (existing?.paddlePriceId ?? null)
        : (existing?.paddlePriceId ?? null);

    updates.push({
      packageCode,
      visible: existing?.visible ?? true,
      customTitle: existing?.customTitle ?? null,
      customPrice: newRetail,
      simCost: newSimCost,
      paddlePriceId: newPaddlePriceId,
      saleBadge: newSaleBadge,
      featured: existing?.featured ?? false,
      sortOrder: existing?.sortOrder ?? 0,
      notes: newNotes,
    });
  }

  if (updates.length === 0) {
    return NextResponse.json({
      success: true,
      affectedCount: 0,
      message: 'No packages matched the selection and conditions.',
    });
  }

  // Process in chunks inside a single transaction (so rollback snapshot is consistent)
  const chunks: typeof updates[] = [];
  for (let i = 0; i < updates.length; i += BULK_UPDATE_CHUNK_SIZE) {
    chunks.push(updates.slice(i, i + BULK_UPDATE_CHUNK_SIZE));
  }

  for (const chunk of chunks) {
    await prisma.$transaction(
      chunk.map((u) =>
        prisma.packageOverride.upsert({
          where: { packageCode: u.packageCode },
          create: {
            packageCode: u.packageCode,
            visible: u.visible,
            customTitle: u.customTitle,
            customPrice: new Prisma.Decimal(u.customPrice),
            simCost: new Prisma.Decimal(u.simCost),
            paddlePriceId: u.paddlePriceId,
            saleBadge: u.saleBadge,
            featured: u.featured,
            sortOrder: u.sortOrder,
            notes: u.notes,
          },
          update: {
            visible: u.visible,
            customTitle: u.customTitle,
            customPrice: new Prisma.Decimal(u.customPrice),
            simCost: new Prisma.Decimal(u.simCost),
            paddlePriceId: u.paddlePriceId,
            saleBadge: u.saleBadge,
            featured: u.featured,
            sortOrder: u.sortOrder,
            notes: u.notes,
          },
        })
      )
    );
  }

  const payloadJson = JSON.stringify(body);
  const rollbackSnapshotJson = JSON.stringify(rollbackSnapshot);

  const log = await prisma.bulkEditLog.create({
    data: {
      adminId,
      affectedCount: updates.length,
      payloadJson,
      rollbackSnapshotJson,
    },
  });

  return NextResponse.json({
    success: true,
    affectedCount: updates.length,
    logId: log.id,
  });
}
