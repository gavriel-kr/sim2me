import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation/schemas';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sendVerificationEmail, toEmailLocale } from '@/lib/email';
import crypto from 'crypto';
// import { checkBotId } from 'botid/server'; // BotID disabled

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit(ip, 'register', 5, 60);
    if (!allowed) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });

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

    const existingByEmail = await prisma.customer.findUnique({
      where: { email: emailLower },
    });
    if (existingByEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Sign in or use forgot password.' },
        { status: 409 }
      );
    }

    const existingByPhone = await prisma.customer.findUnique({
      where: { phone },
    });
    if (existingByPhone) {
      return NextResponse.json(
        { error: 'This phone number is already registered.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.customer.create({
      data: {
        email: emailLower,
        password: hashedPassword,
        name,
        lastName: lastName ?? null,
        phone,
        newsletter: newsletter ?? false,
        emailVerified: false,
        emailVerifyToken,
        emailVerifyExpires,
      },
    });

    /*
      Ticket 039. Awaited, not detached. A detached send is suspended when the instance freezes on
      the response, so the one mail without which the account cannot be used could arrive minutes
      late or never. Registration itself still succeeds if the mail is refused — the customer can
      ask for it again from the login screen.
    */
    const mailSent = await sendVerificationEmail(emailLower, emailVerifyToken, toEmailLocale(body?.locale));
    if (!mailSent) console.error('[Register] Verification email was not accepted', { email: emailLower });

    return NextResponse.json({
      success: true,
      message: 'Account created. Please check your email to verify your account before signing in.',
      requiresVerification: true,
    });
  } catch (e) {
    console.error('[Register]', e);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
