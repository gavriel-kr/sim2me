/**
 * GET order by Paddle transaction ID (for success page polling).
 * Returns public order summary. Secrets (QR / SM-DP+ / activation) are only
 * included for 5 minutes after first reveal. No auth required.
 * Transaction IDs are Paddle-generated random strings — not guessable by brute-force.
 * Rate-limited per IP to prevent enumeration attempts.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const TXN_PREFIX = 'txn_';
const MAX_LEN = 64;
const CRED_WINDOW_MS = 5 * 60 * 1000;

function sanitizeTxnId(id: string): string {
  const s = String(id).trim().slice(0, MAX_LEN);
  return s.startsWith(TXN_PREFIX) ? s : '';
}

function publicSummary(order: {
  orderNo: string;
  status: string;
  customerName: string;
  packageName: string;
  packageCode: string;
  dataAmount: string;
  validity: string;
  totalAmount: { toString(): string } | number;
  currency: string;
  createdAt: Date;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
}, secrets: boolean, credsExpiresAt: Date | null) {
  return {
    orderNo: order.orderNo,
    status: order.status,
    customerName: order.customerName,
    packageName: order.packageName,
    packageCode: order.packageCode,
    dataAmount: order.dataAmount,
    validity: order.validity,
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    qrCodeUrl: secrets ? order.qrCodeUrl : null,
    smdpAddress: secrets ? order.smdpAddress : null,
    activationCode: secrets ? order.activationCode : null,
    createdAt: order.createdAt,
    credsExpiresAt: secrets && credsExpiresAt ? credsExpiresAt.toISOString() : null,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip, 'by-transaction', 30, 60);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const { transactionId } = await params;
  const txnId = sanitizeTxnId(transactionId);
  if (!txnId) {
    return NextResponse.json({ error: 'Invalid transaction id' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { paddleTransactionId: txnId },
    select: {
      id: true,
      orderNo: true,
      status: true,
      customerName: true,
      packageName: true,
      packageCode: true,
      dataAmount: true,
      validity: true,
      totalAmount: true,
      currency: true,
      qrCodeUrl: true,
      smdpAddress: true,
      activationCode: true,
      createdAt: true,
      updatedAt: true,
      esimCredsRevealedAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ order: null, status: 'pending' });
  }

  let secrets = false;
  let credsExpiresAt: Date | null = null;

  if (order.status === 'COMPLETED') {
    let revealedAt = order.esimCredsRevealedAt;
    if (!revealedAt) {
      const ageMs = Date.now() - order.updatedAt.getTime();
      if (ageMs <= CRED_WINDOW_MS) {
        await prisma.order.updateMany({
          where: { id: order.id, esimCredsRevealedAt: null },
          data: { esimCredsRevealedAt: new Date() },
        });
        const fresh = await prisma.order.findUnique({
          where: { id: order.id },
          select: { esimCredsRevealedAt: true },
        });
        revealedAt = fresh?.esimCredsRevealedAt ?? new Date();
      }
    }
    if (revealedAt && Date.now() - revealedAt.getTime() <= CRED_WINDOW_MS) {
      secrets = true;
      credsExpiresAt = new Date(revealedAt.getTime() + CRED_WINDOW_MS);
    }
  }

  return NextResponse.json({
    order: publicSummary(order, secrets, credsExpiresAt),
    status: order.status.toLowerCase(),
  });
}
