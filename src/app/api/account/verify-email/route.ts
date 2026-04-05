import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token')?.trim();

  if (!token || token.length > 128) {
    return NextResponse.redirect(new URL('/he/account/login?verifyError=invalid', request.url));
  }

  const customer = await prisma.customer.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExpires: { gt: new Date() },
    },
  });

  if (!customer) {
    return NextResponse.redirect(new URL('/he/account/login?verifyError=expired', request.url));
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });

  return NextResponse.redirect(new URL('/he/account/login?verified=true', request.url));
}
