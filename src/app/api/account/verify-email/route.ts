import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token.trim() : null;
    if (!token) {
      return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Invalid or expired verification link. You can request a new one from your account.' }, { status: 400 });
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[Verify email]', e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
