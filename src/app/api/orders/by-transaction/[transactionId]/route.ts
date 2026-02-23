/**
 * GET order by Paddle transaction ID (for success page polling).
 * Returns public order summary: status, QR, install details. No auth required.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TXN_PREFIX = 'txn_';
const MAX_LEN = 64;

function sanitizeTxnId(id: string): string {
  const s = String(id).trim().slice(0, MAX_LEN);
  return s.startsWith(TXN_PREFIX) ? s : '';
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
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
      dataAmount: true,
      validity: true,
      qrCodeUrl: true,
      smdpAddress: true,
      activationCode: true,
      createdAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ order: null, status: 'pending' });
  }

  return NextResponse.json({
    order: {
      orderNo: order.orderNo,
      status: order.status,
      customerName: order.customerName,
      packageName: order.packageName,
      dataAmount: order.dataAmount,
      validity: order.validity,
      qrCodeUrl: order.qrCodeUrl,
      smdpAddress: order.smdpAddress,
      activationCode: order.activationCode,
      createdAt: order.createdAt,
    },
    status: order.status.toLowerCase(),
  });
}
