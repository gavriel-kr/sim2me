import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation/schemas';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const VERIFY_EXPIRY_HOURS = 24;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, name, lastName, phone, newsletter } = parsed.data;
    const emailLower = email.toLowerCase().trim();

    const existing = await prisma.customer.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      if (existing.password) {
        return NextResponse.json({ error: 'An account with this email already exists. Sign in or use forgot password.' }, { status: 409 });
      }
      // Legacy record without password: update it with new data and set password
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + VERIFY_EXPIRY_HOURS * 60 * 60 * 1000);
      const hashedPassword = await hash(password, 12);
      await prisma.customer.update({
        where: { id: existing.id },
        data: {
          password: hashedPassword,
          name: name || existing.name,
          lastName: lastName ?? existing.lastName,
          phone: phone ?? existing.phone,
          newsletter: newsletter ?? existing.newsletter,
          emailVerifyToken: token,
          emailVerifyExpires: expires,
          emailVerified: false,
        },
      });
      await sendVerificationEmail(existing.email, token);
      return NextResponse.json({ success: true, message: 'Account updated. Please check your email to verify.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + VERIFY_EXPIRY_HOURS * 60 * 60 * 1000);
    const hashedPassword = await hash(password, 12);

    await prisma.customer.create({
      data: {
        email: emailLower,
        password: hashedPassword,
        name,
        lastName: lastName ?? null,
        phone: phone || null,
        newsletter: newsletter ?? false,
        emailVerified: false,
        emailVerifyToken: token,
        emailVerifyExpires: expires,
      },
    });

    await sendVerificationEmail(emailLower, token);

    return NextResponse.json({ success: true, message: 'Account created. Please check your email to verify your address.' });
  } catch (e) {
    console.error('[Register]', e);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
