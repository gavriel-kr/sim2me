/**
 * POST /api/account/otp/enable
 * Enables Email OTP 2FA for the authenticated customer.
 * Verifies the test code previously sent via /api/account/otp/send-setup.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { isOtpValid } from '@/lib/otp';

export async function POST(request: Request) {
  const session = await getSessionForRequest(request);
  if (!isCustomerSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, 'otp-enable', 5, 300);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  let otpCode: string;
  try {
    const body = await request.json();
    otpCode = typeof body?.otpCode === 'string' ? body.otpCode.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!otpCode || otpCode.length !== 6) {
    return NextResponse.json({ error: 'Please enter the 6-digit code.' }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.user.id } });
  if (!customer) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  if (!customer.otpCodeHash || !customer.otpCodeExpires) {
    return NextResponse.json({ error: 'No code was sent. Please request a new code.' }, { status: 400 });
  }

  if (customer.otpAttempts >= 5) {
    return NextResponse.json({ error: 'Too many failed attempts. Please request a new code.' }, { status: 429 });
  }

  const valid = isOtpValid(otpCode, customer.otpCodeHash, customer.otpCodeExpires);
  if (!valid) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { otpAttempts: { increment: 1 } },
    });
    return NextResponse.json({ error: 'Incorrect or expired code. Please try again.' }, { status: 400 });
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      otpEnabled: true,
      otpCodeHash: null,
      otpCodeExpires: null,
      otpAttempts: 0,
    },
  });

  return NextResponse.json({ ok: true });
}
