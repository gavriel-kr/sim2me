import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await params;
  const notes = await prisma.contactNote.findMany({
    where: { submissionId: id },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(notes);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

  const note = await prisma.contactNote.create({
    data: { submissionId: id, content: content.trim() },
  });
  return NextResponse.json(note);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { noteId } = await req.json();
  if (!noteId) return NextResponse.json({ error: 'Note ID required' }, { status: 400 });

  await prisma.contactNote.delete({ where: { id: noteId } });
  return NextResponse.json({ ok: true });
}
