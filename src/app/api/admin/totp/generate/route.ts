import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const adminEmail = session!.user!.email!;

  const secret = authenticator.generateSecret();

  // Save unconfirmed secret — only activated after user verifies
  await prisma.adminUser.update({
    where: { email: adminEmail },
    data: { totpSecret: secret, totpEnabled: false },
  });

  const otpauthUrl = authenticator.keyuri(adminEmail, 'Sim2Me Admin', secret);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({ secret, qrDataUrl });
}
