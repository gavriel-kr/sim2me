import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { generateTotpSecret, buildOtpauthUrl } from '@/lib/totp';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const adminEmail = session!.user!.email!;

  try {
    const secret = generateTotpSecret();

    await prisma.adminUser.update({
      where: { email: adminEmail },
      data: { totpSecret: secret, totpEnabled: false },
    });

    const otpauthUrl = buildOtpauthUrl(adminEmail, 'Sim2Me Admin', secret);

    return NextResponse.json({ secret, otpauthUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[TOTP Generate] Error:', err);
    return NextResponse.json({ error: 'Failed to generate 2FA setup', detail: msg }, { status: 500 });
  }
}
