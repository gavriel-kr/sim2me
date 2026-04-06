import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { sendPostPurchaseEmail } from '@/lib/email';
import { createAuditLog } from '@/lib/audit';

function baseUrl(): string {
  const u = process.env.NEXT_PUBLIC_SITE_URL;
  return u ? u.replace(/\/$/, '') : 'https://www.sim2me.net';
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNo: true,
      status: true,
      customerEmail: true,
      customerName: true,
      packageName: true,
      dataAmount: true,
      validity: true,
      iccid: true,
      qrCodeUrl: true,
      smdpAddress: true,
      activationCode: true,
    },
  });

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'COMPLETED') return NextResponse.json({ ok: false, error: 'Only COMPLETED orders can have email resent' });
  if (!order.iccid) return NextResponse.json({ ok: false, error: 'No eSIM profile yet — nothing to send' });

  try {
    await sendPostPurchaseEmail(order.customerEmail, {
      customerName: order.customerName || 'Customer',
      planName: order.packageName,
      dataGb: order.dataAmount,
      validityDays: order.validity,
      qrCodeUrl: order.qrCodeUrl ?? null,
      smdpAddress: order.smdpAddress ?? '—',
      activationCode: order.activationCode ?? '—',
      loginLink: `${baseUrl()}/account`,
      email: order.customerEmail,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg });
  }

  createAuditLog({
    adminEmail: session!.user!.email!,
    adminName: session!.user!.name ?? '',
    action: 'RESEND_EMAIL',
    targetType: 'Order',
    targetId: id,
    details: { orderNo: order.orderNo, customerEmail: order.customerEmail },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
