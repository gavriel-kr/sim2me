import { NextResponse } from 'next/server';
import { verifyTurnstile } from '@/lib/turnstile';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, 'turnstile-verify', 10, 60);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let token: string;
  try {
    const body = await request.json();
    token = typeof body?.token === 'string' ? body.token : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const ok = await verifyTurnstile(token, ip);
  if (!ok) {
    return NextResponse.json({ error: 'Security check failed. Please try again.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
