/**
 * POST /api/account/otp/disable
 * Disables Email OTP 2FA. Requires current password + a fresh OTP code for safety.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { generateOtpCode, hashOtpCode, isOtpValid, otpExpiresAt } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: Request) {
  const session = await getSessionForRequest(request);
  if (!isCustomerSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, 'otp-disable', 5, 300);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  let password: string, otpCode: string;
  try {
    const body = await request.json();
    password = typeof body?.password === 'string' ? body.password : '';
    otpCode = typeof body?.otpCode === 'string' ? body.otpCode.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.user.id } });
  if (!customer || !customer.password) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  if (!customer.otpEnabled) {
    return NextResponse.json({ error: '2FA is not enabled.' }, { status: 400 });
  }

  // Verify current password
  const passwordValid = await compare(password, customer.password);
  if (!passwordValid) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 });
  }

  // If no OTP code submitted yet: send a code and ask user to confirm
  if (!otpCode) {
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
    return NextResponse.json({ codeSent: true });
  }

  // Verify OTP code
  if (!customer.otpCodeHash || !customer.otpCodeExpires) {
    return NextResponse.json({ error: 'No code was sent. Please try again.' }, { status: 400 });
  }

  if (customer.otpAttempts >= 5) {
    return NextResponse.json({ error: 'Too many failed attempts. Please try again later.' }, { status: 429 });
  }

  const codeValid = isOtpValid(otpCode, customer.otpCodeHash, customer.otpCodeExpires);
  if (!codeValid) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { otpAttempts: { increment: 1 } },
    });
    return NextResponse.json({ error: 'Incorrect or expired code.' }, { status: 400 });
  }

  // All checks passed — disable OTP
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      otpEnabled: false,
      otpCodeHash: null,
      otpCodeExpires: null,
      otpAttempts: 0,
    },
  });

  return NextResponse.json({ ok: true });
}
