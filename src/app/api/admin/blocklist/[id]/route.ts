import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const item = await prisma.blockedItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.blockedItem.delete({ where: { id } });

  createAuditLog({
    adminEmail: session!.user!.email!,
    adminName: session!.user!.name ?? '',
    action: 'UNBLOCK_ITEM',
    targetType: 'BlockedItem',
    targetId: id,
    details: { type: item.type, value: item.value },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
