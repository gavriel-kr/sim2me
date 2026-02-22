import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const type = (session?.user as { type?: string })?.type;
  const id = (session?.user as { id?: string })?.id;

  if (type !== 'customer' || !id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { password: true },
  });

  if (!customer?.password) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const valid = await compare(currentPassword, customer.password);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const hashed = await hash(newPassword, 12);
  await prisma.customer.update({ where: { id }, data: { password: hashed } });

  return NextResponse.json({ success: true });
}
