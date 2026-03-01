/**
 * POST /api/auth/token
 * Mobile/app login: accepts email + password, returns a JWT compatible with
 * NextAuth session (same secret, same payload shape). Use Authorization: Bearer <token>.
 */

import { NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

const JWT_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, same as authOptions.session.maxAge

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const emailLower = email.trim().toLowerCase();

    const customer = await prisma.customer.findUnique({
      where: { email: emailLower },
    });

    if (!customer?.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await compare(password, customer.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const token = await encode({
      secret,
      maxAge: JWT_MAX_AGE,
      token: {
        id: customer.id,
        email: customer.email,
        name: customer.name ?? '',
        type: 'customer',
      },
    });

    return NextResponse.json({ token });
  } catch (e) {
    console.error('[auth/token]', e);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
