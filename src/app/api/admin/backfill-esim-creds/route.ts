import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { listEsimsPage } from '@/lib/esimaccess';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST — Backfill smdpAddress / activationCode / qrCodeUrl for COMPLETED orders
 * that have an ICCID but are missing install credentials.
 * Paginates through eSIMaccess full eSIM list and matches by ICCID.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  // Find orders that need backfill
  const ordersToFill = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      iccid: { not: null },
      OR: [
        { smdpAddress: null },
        { activationCode: null },
      ],
    },
    select: { id: true, iccid: true },
  });

  if (ordersToFill.length === 0) {
    return NextResponse.json({ updated: 0, total: 0, message: 'Nothing to backfill' });
  }

  console.log(`[backfill-esim-creds] ${ordersToFill.length} orders need backfill`);

  // Build ICCID → order lookup
  const iccidMap = new Map<string, string>(); // iccid → order.id
  for (const o of ordersToFill) {
    if (o.iccid) iccidMap.set(o.iccid, o.id);
  }

  // Page through eSIMaccess full list to find matching eSIMs
  const credMap = new Map<string, { smdpAddress?: string; activationCode?: string; qrCodeUrl?: string }>();
  let pageNum = 1;
  while (true) {
    const page = await listEsimsPage(pageNum, 100);
    const list = page?.esimList ?? [];
    console.log(`[backfill-esim-creds] page ${pageNum}: ${list.length} eSIMs from API`);

    // Log first item to see what fields eSIMaccess actually returns
    if (pageNum === 1 && list.length > 0) {
      console.log('[backfill-esim-creds] sample eSIM fields:', JSON.stringify(list[0]));
    }

    for (const esim of list) {
      if (!esim.iccid) continue;
      if (iccidMap.has(esim.iccid)) {
        credMap.set(esim.iccid, {
          smdpAddress: esim.smdpAddress || undefined,
          activationCode: esim.activationCode || undefined,
          qrCodeUrl: esim.qrCodeUrl || undefined,
        });
      }
    }

    if (list.length < 100) break; // last page
    pageNum++;
    if (pageNum > 20) break; // safety cap (2000 eSIMs max)
  }

  console.log(`[backfill-esim-creds] found credentials for ${credMap.size} matching eSIMs`);

  // Update orders
  let updated = 0;
  await Promise.all(
    ordersToFill.map(async (o: typeof ordersToFill[number]) => {
      if (!o.iccid) return;
      const creds = credMap.get(o.iccid);
      if (!creds) return;

      const patch: Record<string, string> = {};
      if (creds.smdpAddress) patch.smdpAddress = creds.smdpAddress;
      if (creds.activationCode) patch.activationCode = creds.activationCode;
      if (creds.qrCodeUrl) patch.qrCodeUrl = creds.qrCodeUrl;
      if (Object.keys(patch).length === 0) return;

      await prisma.order.update({ where: { id: o.id }, data: patch });
      updated++;
    })
  );

  console.log(`[backfill-esim-creds] updated ${updated} orders`);
  return NextResponse.json({ updated, total: ordersToFill.length });
}
