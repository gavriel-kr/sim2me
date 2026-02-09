import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET all overrides */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const overrides = await prisma.packageOverride.findMany();
  return NextResponse.json({ overrides });
}

/** POST - create or update an override */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { packageCode, visible, customTitle, customPrice, saleBadge, featured, sortOrder, notes } = body;

  if (!packageCode) {
    return NextResponse.json({ error: 'packageCode is required' }, { status: 400 });
  }

  const override = await prisma.packageOverride.upsert({
    where: { packageCode },
    create: {
      packageCode,
      visible: visible ?? true,
      customTitle: customTitle || null,
      customPrice: customPrice != null ? customPrice : null,
      saleBadge: saleBadge || null,
      featured: featured ?? false,
      sortOrder: sortOrder ?? 0,
      notes: notes || null,
    },
    update: {
      visible: visible ?? true,
      customTitle: customTitle || null,
      customPrice: customPrice != null ? customPrice : null,
      saleBadge: saleBadge || null,
      featured: featured ?? false,
      sortOrder: sortOrder ?? 0,
      notes: notes || null,
    },
  });

  return NextResponse.json({ override });
}

/** PATCH - bulk update visibility */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { updates } = body as { updates: { packageCode: string; visible: boolean }[] };

  if (!updates?.length) {
    return NextResponse.json({ error: 'updates array required' }, { status: 400 });
  }

  await prisma.$transaction(
    updates.map((u) =>
      prisma.packageOverride.upsert({
        where: { packageCode: u.packageCode },
        create: { packageCode: u.packageCode, visible: u.visible },
        update: { visible: u.visible },
      })
    )
  );

  return NextResponse.json({ success: true });
}
