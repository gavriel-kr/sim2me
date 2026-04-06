import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const addSchema = z.object({
  type: z.enum(['IP', 'EMAIL']),
  value: z.string().min(1).max(320).trim(),
  reason: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const items = await prisma.blockedItem.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await request.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { type, value, reason } = parsed.data;
  const v = value.toLowerCase();

  const item = await prisma.blockedItem.upsert({
    where: { type_value: { type, value: v } },
    update: { reason: reason ?? null, autoBlocked: false },
    create: { type, value: v, reason: reason ?? null, autoBlocked: false },
  });

  createAuditLog({
    adminEmail: session!.user!.email!,
    adminName: session!.user!.name ?? '',
    action: 'BLOCK_ITEM',
    targetType: 'BlockedItem',
    targetId: item.id,
    details: { type, value: v, reason },
  }).catch(() => {});

  return NextResponse.json({ ok: true, item });
}
