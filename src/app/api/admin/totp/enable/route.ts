import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
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

  if (!admin?.totpSecret) {
    return NextResponse.json({ error: 'No TOTP secret generated. Start setup first.' }, { status: 400 });
  }

  const valid = authenticator.verify({ token: parsed.data.code, secret: admin.totpSecret });
  if (!valid) {
    return NextResponse.json({ error: 'Invalid code. Please check your authenticator app.' }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { email: adminEmail },
    data: { totpEnabled: true, totpVerifiedAt: new Date() },
  });

  createAuditLog({ adminEmail, adminName: session!.user!.name ?? '', action: 'ENABLE_2FA' }).catch(() => {});

  return NextResponse.json({ success: true });
}
