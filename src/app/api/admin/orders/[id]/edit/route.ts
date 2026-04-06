import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

const ALLOWED_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'] as const;
type AllowedStatus = typeof ALLOWED_STATUSES[number];

interface EditBody {
  customerEmail?: string;
  customerName?: string;
  status?: string;
  errorMessage?: string;
  notes?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await request.json() as EditBody;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNo: true,
      customerEmail: true,
      customerName: true,
      status: true,
      errorMessage: true,
      notes: true,
    },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // Build allowed update fields (whitelist only)
  const data: Record<string, string | null> = {};
  if (body.customerEmail !== undefined) data.customerEmail = body.customerEmail.trim() || order.customerEmail;
  if (body.customerName !== undefined) data.customerName = body.customerName.trim();
  if (body.errorMessage !== undefined) data.errorMessage = body.errorMessage.trim() || null;
  if (body.notes !== undefined) data.notes = body.notes.trim() || null;
  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status as AllowedStatus)) {
      return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
    }
    data.status = body.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data,
    select: {
      id: true,
      orderNo: true,
      customerEmail: true,
      customerName: true,
      status: true,
      errorMessage: true,
      notes: true,
      archivedAt: true,
    },
  });

  createAuditLog({
    adminEmail: session!.user!.email!,
    adminName: session!.user!.name ?? '',
    action: 'EDIT_ORDER',
    targetType: 'Order',
    targetId: id,
    details: {
      orderNo: order.orderNo,
      before: { customerEmail: order.customerEmail, customerName: order.customerName, status: order.status, errorMessage: order.errorMessage, notes: order.notes },
      after: data,
    },
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    order: {
      ...updated,
      archivedAt: updated.archivedAt?.toISOString() ?? null,
    },
  });
}
