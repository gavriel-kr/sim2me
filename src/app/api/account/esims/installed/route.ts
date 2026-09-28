/**
 * Ticket 042 — the customer tells us when they installed their phone-plan eSIM (2026-09-28).
 *
 * PikaSim does not report it, and a plan starts counting at installation, so this is the only way to
 * know the real end date. Without it the end is counted from the purchase (see phone-validity.ts).
 * Only the owner of the original sale can set it; a date before the purchase or in the future is
 * refused. Answers with the recomputed window so the account page can show it at once.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { isValidInstallDate, loadPlanWindow, setInstalledOn } from '@/lib/phone-validity';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  orderId: z.string().min(1).max(64),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  const session = await getSessionForRequest(request);
  if (!isCustomerSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { orderId, date } = parsed.data;

  if (!(await checkRateLimit(session.user.id, 'phone-installed', 20, 3600))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.user.id }, select: { id: true, email: true } });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      packageCode: { startsWith: 'pk:' },
      status: 'COMPLETED',
      OR: [{ customerId: customer.id }, { customerEmail: customer.email }],
    },
    select: { id: true, validity: true, paidAt: true, createdAt: true },
  });
  if (!order) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!isValidInstallDate(date, order.paidAt ?? order.createdAt)) {
    return NextResponse.json({ error: 'INVALID_DATE' }, { status: 400 });
  }

  await setInstalledOn(order.id, date);
  const window = await loadPlanWindow(order);
  return NextResponse.json({ ok: true, plan: window });
}
