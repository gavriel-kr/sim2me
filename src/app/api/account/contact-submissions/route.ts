import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ submissions: [] });

  const customer = await prisma.customer.findUnique({
    where: { email: session.user.email },
    select: { email: true, phone: true },
  });
  if (!customer) return NextResponse.json({ submissions: [] });

  const where = customer.phone
    ? { OR: [{ email: customer.email }, { phone: customer.phone }] }
    : { email: customer.email };

  const submissions = await prisma.contactSubmission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      subject: true,
      message: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ submissions: submissions.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  })) });
}
