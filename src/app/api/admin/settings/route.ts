import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { settings } = await request.json();

  // Upsert each setting
  const ops = Object.entries(settings).map(([key, value]) =>
    prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    })
  );

  await prisma.$transaction(ops);
  createAuditLog({ adminEmail: session!.user!.email!, adminName: session!.user!.name ?? '', action: 'UPDATE_SETTINGS', details: { keys: Object.keys(settings) } }).catch(() => {});
  return NextResponse.json({ success: true });
}
