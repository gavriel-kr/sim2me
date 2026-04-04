import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET — return all featured destination location codes */
export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const featured = await prisma.featuredDestination.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  return NextResponse.json({ featured });
}

/** POST — replace the full featured destinations list */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const denied2 = requireAdmin(session);
  if (denied2) return denied2;

  const body = await req.json();
  const { locationCodes } = body as { locationCodes: string[] };

  if (!Array.isArray(locationCodes)) {
    return NextResponse.json({ error: 'locationCodes must be an array' }, { status: 400 });
  }

  // Replace list: delete all then re-insert with new display order
  await prisma.$transaction([
    prisma.featuredDestination.deleteMany(),
    ...locationCodes.map((code, idx) =>
      prisma.featuredDestination.create({
        data: { locationCode: code.toUpperCase(), displayOrder: idx },
      })
    ),
  ]);

  return NextResponse.json({ ok: true, count: locationCodes.length });
}
