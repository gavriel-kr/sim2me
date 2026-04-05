/**
 * POST /api/account/otp/send-setup
 * Sends a test OTP code during the 2FA enable setup flow.
 * Requires active customer session. Rate-limited: 3 sends per 10 min per IP.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { generateOtpCode, hashOtpCode, otpExpiresAt } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: Request) {
  const session = await getSessionForRequest(request);
  if (!isCustomerSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, 'otp-setup-send', 3, 600);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait before requesting a new code.' }, { status: 429 });
  }

  const customerId = session.user.id;
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const code = generateOtpCode();
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      otpCodeHash: hashOtpCode(code),
      otpCodeExpires: otpExpiresAt(),
      otpAttempts: 0,
    },
  });

  const sent = await sendOtpEmail(customer.email, code);
  if (!sent) {
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
