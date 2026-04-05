import { NextResponse } from 'next/server';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { passwordSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, 'change-password', 5, 60);
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });

  const session = await getSessionForRequest(request);
  if (!isCustomerSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = session.user.id;

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
  await prisma.customer.update({ where: { id }, data: { password: hashed, passwordChangedAt: new Date() } });

  return NextResponse.json({ success: true });
}
