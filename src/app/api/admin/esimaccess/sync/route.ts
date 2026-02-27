/**
 * POST /api/admin/esimaccess/sync
 *
 * Fetches all eSIMs from eSIMaccess (paginated) and imports any
 * that are missing from our DB as unassigned stub orders.
 *
 * Stub orders have:
 *  - customerEmail: "" (no customer yet)
 *  - totalAmount:   0  (retail price unknown)
 *  - status:        mapped from eSIMaccess status
 *  - All eSIM profile fields populated from the API response
 *
 * Returns: { imported, alreadyExist, errors, rawSample }
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { listEsimsPage, type EsimListItem } from '@/lib/esimaccess';

export const dynamic = 'force-dynamic';

// ─── Helpers ─────────────────────────────────────────────────

function mapStatus(apiStatus?: string): string {
  if (!apiStatus) return 'COMPLETED';
  const s = apiStatus.toUpperCase();
  if (s === 'COMPLETED' || s === 'ACTIVE' || s === 'IN_USE' || s === 'USED') return 'COMPLETED';
  if (s === 'PENDING' || s === 'PROCESSING' || s === 'CREATING') return 'PENDING';
  if (s === 'FAILED' || s === 'ERROR') return 'FAILED';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED';
  if (s === 'REFUNDED') return 'REFUNDED';
  return 'COMPLETED'; // default for unknown statuses from eSIMaccess
}

/** Convert API price units → USD (divide by 10000) */
function toUsd(apiUnits?: number): number | null {
  if (apiUnits == null) return null;
  return apiUnits / 10000;
}

/** Bytes → human-readable string */
function bytesToStr(bytes?: number): string {
  if (bytes == null || bytes <= 0) return '0';
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  const mb = bytes / (1024 ** 2);
  return mb >= 1 ? `${mb.toFixed(0)} MB` : `${bytes} B`;
}

function extractPackageInfo(item: EsimListItem) {
  // Try flat fields first, then fall back to packageList[0]
  const pkg = item.packageList?.[0];
  const code = item.packageCode || pkg?.packageCode || '';
  const name = item.packageName || pkg?.packageName || 'Unknown Package';
  const location = item.locationName || item.locationCode || pkg?.location || pkg?.locationCode || 'Unknown';
  const volume = item.orderVolume ?? pkg?.volume;
  const duration = pkg?.duration;
  return {
    packageCode: code || 'UNKNOWN',
    packageName: name,
    destination: location,
    dataAmount: bytesToStr(volume),
    validity: duration != null ? String(duration) : '0',
  };
}

// ─── Route ───────────────────────────────────────────────────

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const errors: string[] = [];
  let imported = 0;
  let alreadyExist = 0;
  let rawSample: EsimListItem | null = null;

  try {
    // ── 1. Fetch all eSIMs from eSIMaccess (paginated) ──────
    const allEsims: EsimListItem[] = [];
    const PAGE_SIZE = 100;
    let page = 1;

    while (true) {
      let result: { esimList: EsimListItem[] };
      try {
        result = await listEsimsPage(page, PAGE_SIZE);
      } catch (err) {
        errors.push(`Page ${page} fetch error: ${(err as Error).message}`);
        break;
      }

      const list = result.esimList ?? [];
      if (list.length === 0) break;

      allEsims.push(...list);
      if (rawSample === null) rawSample = list[0]; // capture for debugging

      if (list.length < PAGE_SIZE) break; // last page
      page++;

      // Safety: stop at 50 pages (5000 eSIMs max)
      if (page > 50) break;
    }

    if (allEsims.length === 0) {
      return NextResponse.json({
        imported: 0,
        alreadyExist: 0,
        errors,
        rawSample,
        message: 'No eSIMs returned from eSIMaccess API. The /open/esim/query endpoint may require filters.',
      });
    }

    // ── 2. Find which orderNos (Batch IDs) are missing in our DB ──
    // eSIMaccess orderNo is stored as esimOrderId in our DB
    const apiOrderNos = allEsims
      .map((e) => e.orderNo)
      .filter((v): v is string => !!v);

    const existing = await prisma.order.findMany({
      where: { esimOrderId: { in: apiOrderNos } },
      select: { esimOrderId: true },
    });
    const existingSet = new Set(existing.map((o) => o.esimOrderId));

    const toImport = allEsims.filter(
      (e) => e.orderNo && !existingSet.has(e.orderNo),
    );

    alreadyExist = allEsims.length - toImport.length;

    // ── 3. Create stub records for missing ones ──────────────
    for (const item of toImport) {
      try {
        const pkg = extractPackageInfo(item);
        const supplierCost = toUsd(item.price);
        const status = mapStatus(item.status);

        await prisma.order.create({
          data: {
            customerEmail: '',
            customerName: '',
            customerId: null,
            totalAmount: 0,
            currency: 'USD',
            status: status as import('@prisma/client').OrderStatus,
            esimOrderId: item.orderNo ?? null,
            esimTransactionId: item.transactionId ?? null,
            iccid: item.iccid ?? null,
            qrCodeUrl: item.qrCodeUrl ?? null,
            smdpAddress: item.smdpAddress ?? null,
            activationCode: item.activationCode ?? null,
            supplierCost: supplierCost ?? undefined,
            packageCode: pkg.packageCode,
            packageName: pkg.packageName,
            destination: pkg.destination,
            dataAmount: pkg.dataAmount,
            validity: pkg.validity,
            // createdAt from eSIMaccess if available
            ...(item.createTime ? { createdAt: new Date(item.createTime) } : {}),
          },
        });
        imported++;
      } catch (err) {
        errors.push(`Import error for ${item.orderNo}: ${(err as Error).message}`);
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    imported,
    alreadyExist,
    total: imported + alreadyExist,
    errors: errors.slice(0, 20), // cap error list
    rawSample, // first raw item returned (useful for debugging field names)
  });
}
