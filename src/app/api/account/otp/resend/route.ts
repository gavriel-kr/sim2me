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
import { sendOtpEmail, toEmailLocale, type EmailLocale } from '@/lib/email';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, 'otp-resend', 3, 600);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait before requesting a new code.' }, { status: 429 });
  }

  let email: string;
  let locale: EmailLocale;
  try {
    const body = await request.json();
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    locale = toEmailLocale(body?.locale);
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

  /*
    Ticket 039. Awaited: a login code that arrives after the instance thaws is a code the customer
    could not use. The response still reports success either way, because telling an unauthenticated
    caller whether mail to this address succeeded would confirm the account exists.
  */
  const sent = await sendOtpEmail(customer.email, code, locale);
  if (!sent) console.error('[OTP resend] Code email was not accepted', { customerId: customer.id });

  return NextResponse.json({ ok: true });
}
