import { NextResponse } from 'next/server';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { profileSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getSessionForRequest(request);
  if (!isCustomerSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = session.user.id;

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      lastName: true,
      phone: true,
      newsletter: true,
      createdAt: true,
    },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  return NextResponse.json(customer);
}

export async function PATCH(request: Request) {
  const session = await getSessionForRequest(request);
  if (!isCustomerSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = session.user.id;

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
      phone,
      newsletter: newsletter ?? false,
    },
  });

  return NextResponse.json({ success: true });
}
