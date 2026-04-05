import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { resetPasswordSchema } from '@/lib/validation/schemas';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit(ip, 'reset-password', 5, 900);
    if (!allowed) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const customer = await prisma.customer.findFirst({
      where: {
        resetToken: token,
        resetExpires: { gt: new Date() },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new password reset.' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
        passwordChangedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: 'Password updated. You can now sign in.' });
  } catch (e) {
    console.error('[Reset password]', e);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
