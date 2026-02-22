import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export const dynamic = 'force-dynamic';

function requireAdmin(session: unknown) {
  if (!session || typeof session !== 'object') return null;
  const u = (session as { user?: { type?: string } }).user;
  if (!u || u.type !== 'admin') return null;
  return u;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  // Do not send password hash to client
  const { password: _, ...safe } = customer;
  return NextResponse.json(safe);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const body = await request.json();

  const data: {
    email?: string;
    name?: string;
    lastName?: string | null;
    phone?: string | null;
    newsletter?: boolean;
    emailVerified?: boolean;
    password?: string;
  } = {};

  if (typeof body.email === 'string' && body.email.trim()) {
    const email = body.email.trim().toLowerCase();
    const existing = await prisma.customer.findFirst({ where: { email, NOT: { id } } });
    if (existing) return NextResponse.json({ error: 'Another account uses this email' }, { status: 400 });
    data.email = email;
  }
  if (typeof body.name === 'string') data.name = body.name.trim() || '';
  if (body.lastName !== undefined) data.lastName = body.lastName === '' || body.lastName === null ? null : String(body.lastName).trim();
  if (body.phone !== undefined) data.phone = body.phone === '' || body.phone === null ? null : String(body.phone).trim();
  if (typeof body.newsletter === 'boolean') data.newsletter = body.newsletter;
  if (typeof body.emailVerified === 'boolean') data.emailVerified = body.emailVerified;
  if (typeof body.password === 'string' && body.password.length >= 8) {
    data.password = await hash(body.password, 12);
  }

  const updated = await prisma.customer.update({
    where: { id },
    data,
  });

  const { password: _, ...safe } = updated;
  return NextResponse.json(safe);
}
