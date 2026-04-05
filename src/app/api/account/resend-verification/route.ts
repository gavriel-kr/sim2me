import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import crypto from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, 'resend-verification', 2, 3600);
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Please try again in an hour.' }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: true }); // Don't reveal validation errors
  }

  const emailLower = parsed.data.email.toLowerCase().trim();
  const customer = await prisma.customer.findUnique({ where: { email: emailLower } });

  // Always return success to avoid email enumeration
  if (!customer || customer.emailVerified) {
    return NextResponse.json({ success: true });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.customer.update({
    where: { id: customer.id },
    data: { emailVerifyToken: token, emailVerifyExpires: expires },
  });

  sendVerificationEmail(emailLower, token).catch(() => {});

  return NextResponse.json({ success: true });
}
