import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();

  const { name, email, phone, subject, message, marketingConsent, read, status } = body;

  const updated = await prisma.contactSubmission.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(subject !== undefined && { subject }),
      ...(message !== undefined && { message }),
      ...(marketingConsent !== undefined && { marketingConsent }),
      ...(read !== undefined && { read }),
      ...(status !== undefined && { status }),
    },
  });
  return NextResponse.json(updated);
}
