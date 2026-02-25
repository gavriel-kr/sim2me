import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { RollbackSnapshotItem } from '@/lib/bulk-edit-types';
import { BULK_UPDATE_CHUNK_SIZE } from '@/lib/bulk-edit-types';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

function isAdmin(session: unknown): boolean {
  return (session as { user?: { type?: string } })?.user?.type === 'admin';
}

/** POST — rollback a bulk edit by log ID. Restores overrides from rollback snapshot. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { logId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { logId } = body;
  if (!logId) return NextResponse.json({ error: 'logId required' }, { status: 400 });

  const log = await prisma.bulkEditLog.findUnique({
    where: { id: logId },
  });
  if (!log) return NextResponse.json({ error: 'Bulk edit log not found' }, { status: 404 });

  let snapshot: RollbackSnapshotItem[];
  try {
    snapshot = JSON.parse(log.rollbackSnapshotJson) as RollbackSnapshotItem[];
  } catch {
    return NextResponse.json({ error: 'Invalid rollback snapshot' }, { status: 500 });
  }

  const toDelete: string[] = [];
  const toUpsert: { packageCode: string; override: NonNullable<RollbackSnapshotItem['override']> }[] = [];

  for (const item of snapshot) {
    if (item.override === null) {
      toDelete.push(item.packageCode);
    } else {
      toUpsert.push({ packageCode: item.packageCode, override: item.override });
    }
  }

  await prisma.$transaction(async (tx) => {
    if (toDelete.length > 0) {
      await tx.packageOverride.deleteMany({ where: { packageCode: { in: toDelete } } });
    }
    for (let i = 0; i < toUpsert.length; i += BULK_UPDATE_CHUNK_SIZE) {
      const chunk = toUpsert.slice(i, i + BULK_UPDATE_CHUNK_SIZE);
      await Promise.all(
        chunk.map(({ packageCode, override }) =>
          tx.packageOverride.upsert({
            where: { packageCode },
            create: {
              packageCode,
              visible: override.visible,
              customTitle: override.customTitle,
              customPrice: override.customPrice != null ? new Prisma.Decimal(override.customPrice) : null,
              simCost: override.simCost != null ? new Prisma.Decimal(override.simCost) : null,
              paddlePriceId: override.paddlePriceId,
              saleBadge: override.saleBadge,
              featured: override.featured,
              sortOrder: override.sortOrder,
              notes: override.notes,
            },
            update: {
              visible: override.visible,
              customTitle: override.customTitle,
              customPrice: override.customPrice != null ? new Prisma.Decimal(override.customPrice) : null,
              simCost: override.simCost != null ? new Prisma.Decimal(override.simCost) : null,
              paddlePriceId: override.paddlePriceId,
              saleBadge: override.saleBadge,
              featured: override.featured,
              sortOrder: override.sortOrder,
              notes: override.notes,
            },
          })
        )
      );
    }
  });

  return NextResponse.json({
    success: true,
    restoredCount: snapshot.length,
  });
}
