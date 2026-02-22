import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { profileSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const type = (session?.user as { type?: string })?.type;
  const id = (session?.user as { id?: string })?.id;

  if (type !== 'customer' || !id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      lastName: true,
      phone: true,
      newsletter: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  return NextResponse.json(customer);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const type = (session?.user as { type?: string })?.type;
  const id = (session?.user as { id?: string })?.id;

  if (type !== 'customer' || !id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, lastName, phone, newsletter } = parsed.data;

  await prisma.customer.update({
    where: { id },
    data: {
      name,
      lastName: lastName ?? null,
      phone: phone || null,
      newsletter: newsletter ?? false,
    },
  });

  return NextResponse.json({ success: true });
}
