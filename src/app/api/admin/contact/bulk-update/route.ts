import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const updates: { id: string; read: boolean }[] = body.updates ?? [];

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  let updated = 0;
  const errors: string[] = [];
  for (const u of updates) {
    try {
      await prisma.contactSubmission.update({
        where: { id: u.id },
        data: { read: u.read },
      });
      updated++;
    } catch {
      errors.push(u.id);
    }
  }
  return NextResponse.json({ updated, total: updates.length, errors });
}
