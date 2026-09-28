/**
 * Ticket 042 — renewal options for one of the customer's phone eSIMs.
 *
 * GET ?orderId=… → whether this number can be renewed, its current end date, and the renewal
 * packages at our price. Only the owner of the order may ask; wholesale cost never leaves the server.
 */

import { NextResponse } from 'next/server';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { daysLeft, getRenewalContext, getRenewalOptions, toPublicRenewalOption } from '@/lib/renewal';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getSessionForRequest(request);
  if (!isCustomerSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orderId = new URL(request.url).searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { id: session.user.id }, select: { id: true, email: true } });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ctx = await getRenewalContext(orderId);
  const owns = ctx && (ctx.customerId === customer.id || ctx.customerEmail.toLowerCase() === customer.email.toLowerCase());
  if (!ctx || !owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const options = ctx.renewable ? await getRenewalOptions(ctx).catch(() => []) : [];
  return NextResponse.json({
    renewable: ctx.renewable,
    region: ctx.region,
    phoneNumber: ctx.phoneNumber,
    expireTime: ctx.expireTime,
    daysLeft: daysLeft(ctx.expireTime),
    baseOrderId: ctx.baseOrderId,
    options: options.map(toPublicRenewalOption),
  });
}
