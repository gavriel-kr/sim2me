import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { verifyTotp } from '@/lib/totp';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ code: z.string().length(6) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
  }

  const adminEmail = session!.user!.email!;
  const admin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });

  if (!admin?.totpEnabled || !admin.totpSecret) {
    return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 });
  }

  const valid = verifyTotp(parsed.data.code, admin.totpSecret);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { email: adminEmail },
    data: { totpEnabled: false, totpSecret: null, totpVerifiedAt: null },
  });

  createAuditLog({ adminEmail, adminName: session!.user!.name ?? '', action: 'DISABLE_2FA' }).catch(() => {});

  return NextResponse.json({ success: true });
}
