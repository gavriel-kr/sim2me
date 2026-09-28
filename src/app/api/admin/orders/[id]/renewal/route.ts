/**
 * Ticket 042 — renewal options for a phone order, for the admin's "Renew" button.
 * Includes our cost, so the internal-sale modal can enforce its price floor.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { daysLeft, getRenewalContext, getRenewalOptions } from '@/lib/renewal';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await params;
  const ctx = await getRenewalContext(id);
  if (!ctx) return NextResponse.json({ error: 'Not a phone order' }, { status: 404 });

  const options = ctx.renewable ? await getRenewalOptions(ctx).catch(() => []) : [];
  return NextResponse.json({
    renewable: ctx.renewable,
    region: ctx.region,
    phoneNumber: ctx.phoneNumber,
    expireTime: ctx.expireTime,
    daysLeft: daysLeft(ctx.expireTime),
    customer: { id: ctx.customerId, email: ctx.customerEmail, name: ctx.customerName },
    options,
  });
}
