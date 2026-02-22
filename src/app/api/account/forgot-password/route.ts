import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validation/schemas';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const RESET_EXPIRY_HOURS = 1;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    // Always return success to avoid email enumeration
    if (!customer?.password) {
      return NextResponse.json({ success: true, message: 'If an account exists with this email, you will receive a password reset link.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.customer.update({
      where: { id: customer.id },
      data: { resetToken: token, resetExpires: expires },
    });

    await sendPasswordResetEmail(customer.email, token);

    return NextResponse.json({ success: true, message: 'If an account exists with this email, you will receive a password reset link.' });
  } catch (e) {
    console.error('[Forgot password]', e);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
