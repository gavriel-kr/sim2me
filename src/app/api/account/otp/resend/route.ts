/**
 * POST /api/account/otp/resend
 * Resends the login OTP code to the customer's email.
 * Called from the login OTP step when the user clicks "Resend code".
 * Rate-limited: 3 sends per 10 minutes per IP.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { generateOtpCode, hashOtpCode, otpExpiresAt } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, 'otp-resend', 3, 600);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait before requesting a new code.' }, { status: 429 });
  }

  let email: string;
  try {
    const body = await request.json();
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { email } });

  // Always return ok to prevent email enumeration
  if (!customer || !customer.otpEnabled) {
    return NextResponse.json({ ok: true });
  }

  const code = generateOtpCode();
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      otpCodeHash: hashOtpCode(code),
      otpCodeExpires: otpExpiresAt(),
      otpAttempts: 0,
    },
  });

  sendOtpEmail(customer.email, code).catch(() => {});

  return NextResponse.json({ ok: true });
}
