import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const apiKey = process.env.PADDLE_API_KEY?.trim();
  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'PADDLE_API_KEY is not set in environment variables' });
  }

  try {
    const res = await fetch('https://api.paddle.com/customers?per_page=1', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const body = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(body); } catch { parsed = body; }

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      paddleApiKeyPrefix: apiKey.slice(0, 8) + '...',
      clientTokenPrefix: clientToken ? clientToken.slice(0, 8) + '...' : 'NOT SET',
      isSandboxApiKey: apiKey.startsWith('test_'),
      isSandboxClientToken: clientToken?.startsWith('test_') ?? false,
      response: parsed,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }
}
