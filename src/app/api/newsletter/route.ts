import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { newsletterSchema } from '@/lib/validation/schemas';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Newsletter signup: marks Customer.newsletter = true.
 * Creates a password-less customer row for new emails (they can claim the
 * account later via forgot-password). Response never reveals whether the
 * email already existed.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit(ip, 'newsletter', 5, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    await prisma.customer.upsert({
      where: { email },
      update: { newsletter: true },
      create: { email, name: '', newsletter: true },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[Newsletter]', e);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
