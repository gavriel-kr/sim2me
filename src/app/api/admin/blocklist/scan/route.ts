/**
 * Retroactive fraud scan: identify existing bad actors and auto-block them.
 * - Emails with 3+ FAILED orders in the last 30 days
 * - Emails/IPs from underpayment fraud orders
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { autoBlock } from '@/lib/fraud';
import { createAuditLog } from '@/lib/audit';

export async function POST(_request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const results: { type: string; value: string; reason: string }[] = [];

  // 1. Emails with 3+ FAILED orders (all time for retroactive scan)
  const failedGroups = await prisma.order.groupBy({
    by: ['customerEmail'],
    where: { status: 'FAILED' },
    _count: { id: true },
    having: { id: { _count: { gte: 3 } } },
  });

  for (const group of failedGroups) {
    const reason = `Retroactive: ${group._count.id} FAILED orders`;
    await autoBlock('EMAIL', group.customerEmail, reason);
    results.push({ type: 'EMAIL', value: group.customerEmail, reason });
  }

  // 2. Underpayment fraud orders — block email + IP
  const fraudOrders = await prisma.order.findMany({
    where: {
      status: 'FAILED',
      errorMessage: { contains: 'underpayment' },
    },
    select: { customerEmail: true, checkoutIp: true },
  });

  for (const o of fraudOrders) {
    const reason = 'Retroactive: underpayment fraud';
    await autoBlock('EMAIL', o.customerEmail, reason);
    results.push({ type: 'EMAIL', value: o.customerEmail, reason });
    if (o.checkoutIp) {
      await autoBlock('IP', o.checkoutIp, reason);
      results.push({ type: 'IP', value: o.checkoutIp, reason });
    }
  }

  const uniqueCount = new Set(results.map((r) => `${r.type}:${r.value}`)).size;

  createAuditLog({
    adminEmail: session!.user!.email!,
    adminName: session!.user!.name ?? '',
    action: 'RETROACTIVE_FRAUD_SCAN',
    details: { blockedCount: uniqueCount, items: results.slice(0, 50) },
  }).catch(() => {});

  return NextResponse.json({ ok: true, blocked: uniqueCount, details: results });
}
