import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { sendPostPurchaseEmail, toEmailLocale } from '@/lib/email';
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
      packageCode: true,
      dataAmount: true,
      validity: true,
      iccid: true,
      qrCodeUrl: true,
      smdpAddress: true,
      activationCode: true,
      destination: true,
      totalAmount: true,
      currency: true,
      locale: true,
      paidAt: true,
      createdAt: true,
    },
  });

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'COMPLETED') return NextResponse.json({ ok: false, error: 'Only COMPLETED orders can have email resent' });
  if (!order.iccid) return NextResponse.json({ ok: false, error: 'No eSIM profile yet — nothing to send' });

  // A resend is the one place the old Hebrew-only fallback was most visible: an English or Arabic
  // buyer asking for their email again used to get it in a language they had never chosen.
  const emailLocale = toEmailLocale(order.locale);

  try {
    await sendPostPurchaseEmail(order.customerEmail, {
      customerName: order.customerName || 'Customer',
      planName: order.packageName,
      phoneNumberPending: order.packageCode.startsWith('pk:'),
      dataGb: order.dataAmount,
      validityDays: order.validity,
      qrCodeUrl: order.qrCodeUrl ?? null,
      smdpAddress: order.smdpAddress ?? '—',
      activationCode: order.activationCode ?? '—',
      loginLink: `${baseUrl()}/${emailLocale}/account`,
      email: order.customerEmail,
      orderNo: order.orderNo,
      amountPaid: Number(order.totalAmount),
      currency: order.currency,
      orderDate: order.paidAt ?? order.createdAt,
      iccid: order.iccid,
    }, emailLocale);
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
