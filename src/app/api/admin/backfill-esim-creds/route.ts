import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEsimProfile, getEsimUsage } from '@/lib/esimaccess';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET — Diagnostic: show DB state + raw eSIMaccess response for first missing order
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const orders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      OR: [{ smdpAddress: null }, { activationCode: null }],
      AND: [{ OR: [{ esimOrderId: { not: null } }, { iccid: { not: null } }] }],
    },
    select: { id: true, esimOrderId: true, iccid: true, smdpAddress: true, activationCode: true, qrCodeUrl: true },
  });

  // Fetch raw API response for first order to see what eSIMaccess actually returns
  let rawApiSample: unknown = null;
  const first = orders[0];
  if (first?.esimOrderId) {
    try {
      const res = await fetch('https://api.esimaccess.com/api/v1/open/esim/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'RT-AccessCode': process.env.ESIMACCESS_ACCESS_CODE!,
        },
        body: JSON.stringify({ orderNo: first.esimOrderId, pager: { pageNum: 1, pageSize: 10 } }),
      });
      rawApiSample = await res.json();
    } catch (e) {
      rawApiSample = { fetchError: String(e) };
    }
  }

  return NextResponse.json({ count: orders.length, firstOrder: first, rawApiSample });
}

/**
 * POST — Backfill smdpAddress / activationCode / qrCodeUrl for COMPLETED orders
 * missing install credentials.
 *
 * Strategy (in priority order):
 *   1. esimOrderId present  → getEsimProfile(esimOrderId)  ← always returns full credentials
 *   2. iccid present only   → getEsimUsage(iccid)           ← best-effort fallback
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const ordersToFill = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      OR: [{ smdpAddress: null }, { activationCode: null }],
      AND: [
        { OR: [{ esimOrderId: { not: null } }, { iccid: { not: null } }] },
      ],
    },
    select: { id: true, esimOrderId: true, iccid: true },
  });

  if (ordersToFill.length === 0) {
    return NextResponse.json({ updated: 0, total: 0, message: 'Nothing to backfill' });
  }

  console.log(`[backfill-esim-creds] ${ordersToFill.length} orders need backfill`);

  let updated = 0;
  let skipped = 0;

  // Process in small batches to avoid rate-limiting
  const BATCH = 5;
  for (let i = 0; i < ordersToFill.length; i += BATCH) {
    const batch = ordersToFill.slice(i, i + BATCH);

    await Promise.allSettled(
      batch.map(async (o: typeof ordersToFill[number]) => {
        try {
          let smdpAddress: string | undefined;
          let activationCode: string | undefined;
          let qrCodeUrl: string | undefined;

          if (o.esimOrderId) {
            // Primary: query by order number — reliably returns all credentials
            const result = await getEsimProfile(o.esimOrderId);
            const profile = result?.esimList?.[0];
            if (profile) {
              smdpAddress = profile.smdpAddress || undefined;
              activationCode = profile.activationCode || undefined;
              qrCodeUrl = profile.qrCodeUrl || undefined;
            }
          } else if (o.iccid) {
            // Fallback: query by ICCID
            const profile = await getEsimUsage(o.iccid);
            if (profile) {
              smdpAddress = profile.smdpAddress || undefined;
              activationCode = profile.activationCode || undefined;
              qrCodeUrl = profile.qrCodeUrl || undefined;
            }
          }

          const patch: Record<string, string> = {};
          if (smdpAddress) patch.smdpAddress = smdpAddress;
          if (activationCode) patch.activationCode = activationCode;
          if (qrCodeUrl) patch.qrCodeUrl = qrCodeUrl;

          if (Object.keys(patch).length === 0) {
            skipped++;
            console.warn(`[backfill-esim-creds] no credentials returned for order ${o.id} (esimOrderId=${o.esimOrderId}, iccid=${o.iccid})`);
            return;
          }

          await prisma.order.update({ where: { id: o.id }, data: patch });
          updated++;
          console.log(`[backfill-esim-creds] updated order ${o.id}: smdp=${smdpAddress?.slice(0, 20)}`);
        } catch (e) {
          skipped++;
          console.error(`[backfill-esim-creds] failed for order ${o.id}:`, e);
        }
      })
    );

    // Small delay between batches to respect API rate limits
    if (i + BATCH < ordersToFill.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`[backfill-esim-creds] done: updated=${updated} skipped=${skipped} total=${ordersToFill.length}`);
  return NextResponse.json({ updated, skipped, total: ordersToFill.length });
}
