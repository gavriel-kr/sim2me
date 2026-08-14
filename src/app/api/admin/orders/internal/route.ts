/**
 * POST /api/admin/orders/internal — sell an eSIM to a customer from the admin panel.
 *
 * No Paddle, no checkout. The admin sets the price; the eSIM is really bought from
 * eSIMaccess, so the supplier cost really leaves the balance. Ticket 032.
 *
 * Deliberate difference from the Paddle webhook: when the purchase succeeds but the
 * profile never arrives, the order stays PROCESSING rather than FAILED. FAILED invites
 * the retry action, which would buy a second eSIM for an order already paid for.
 */

// Allow up to 60s for eSIMaccess profile provisioning retries
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomBytes, randomInt } from 'crypto';
import { hash } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import {
  getBalance,
  getEsimProfileWithRetry,
  getPackages,
  purchasePackage,
  formatDataVolume,
} from '@/lib/esimaccess';
import { sendPostPurchaseEmail, toEmailLocale } from '@/lib/email';
import { createAuditLog } from '@/lib/audit';
import { internalSaleSchema } from '@/lib/validation/schemas';

function baseUrl(): string {
  const u = process.env.NEXT_PUBLIC_SITE_URL;
  return u ? u.replace(/\/$/, '') : 'https://www.sim2me.net';
}

/** Temp password that satisfies the site's own strength rule (8+, uppercase, digit). */
function generateTempPassword(): string {
  const body = randomBytes(6).toString('base64url').replace(/[^A-Za-z0-9]/g, '');
  return `S${body}${randomInt(10, 99)}`;
}

interface OrderResponse {
  id: string;
  orderNo: string;
  status: string;
  customerEmail: string;
  packageName: string;
  totalAmount: number;
  supplierCost: number | null;
  iccid: string | null;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  errorMessage: string | null;
}

function shape(o: {
  id: string; orderNo: string; status: string; customerEmail: string; packageName: string;
  totalAmount: Prisma.Decimal; supplierCost: Prisma.Decimal | null; iccid: string | null;
  qrCodeUrl: string | null; smdpAddress: string | null; activationCode: string | null;
  errorMessage: string | null;
}): OrderResponse {
  return {
    id: o.id,
    orderNo: o.orderNo,
    status: o.status,
    customerEmail: o.customerEmail,
    packageName: o.packageName,
    totalAmount: Number(o.totalAmount),
    supplierCost: o.supplierCost != null ? Number(o.supplierCost) : null,
    iccid: o.iccid,
    qrCodeUrl: o.qrCodeUrl,
    smdpAddress: o.smdpAddress,
    activationCode: o.activationCode,
    errorMessage: o.errorMessage,
  };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  // This action spends from the prepaid eSIMaccess balance — requireAdmin alone admits a VIEWER
  const role = (session!.user as { role?: string }).role;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = internalSaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    idempotencyKey, packageCode, customerId, email, name, lastName, phone,
    priceToCustomer, paymentNote, emailLocale,
  } = parsed.data;

  // ── Idempotency: this key already bought something ────────────
  const alreadyDone = await prisma.order.findUnique({ where: { idempotencyKey } });
  if (alreadyDone) {
    return NextResponse.json({ ok: true, alreadyExisted: true, order: shape(alreadyDone) });
  }

  // ── Resolve the package and its real wholesale cost ───────────
  let pkg;
  try {
    const { packageList } = await getPackages();
    pkg = packageList?.find((p) => p.packageCode === packageCode);
  } catch (e) {
    return NextResponse.json(
      { error: `Could not reach eSIMaccess to price this package: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }
  if (!pkg) {
    return NextResponse.json({ error: `Unknown package code: ${packageCode}` }, { status: 400 });
  }

  // pkg.price is in API units where $1 = 10000. PackageOverride.simCost is deliberately
  // not used here — it exists for profit modelling, while the balance only responds to
  // what the supplier actually charges.
  const supplierCost = (pkg.price ?? 0) / 10000;
  if (!(supplierCost > 0)) {
    return NextResponse.json({ error: 'eSIMaccess did not return a price for this package' }, { status: 502 });
  }

  // ── The floor, enforced server-side ───────────────────────────
  // A cent of tolerance absorbs float representation, not a real discount.
  if (priceToCustomer < supplierCost - 0.005) {
    return NextResponse.json(
      {
        error: `Price must be at least the supplier cost of $${supplierCost.toFixed(2)}.`,
        supplierCost,
      },
      { status: 400 },
    );
  }

  // ── Balance preflight ─────────────────────────────────────────
  // Fails open: a transient balance-API error should not block a legitimate sale, and a
  // real shortfall still surfaces as a clean supplier error on the order below.
  try {
    const { balance } = await getBalance();
    const balanceUsd = (balance ?? 0) / 10000;
    if (balanceUsd < supplierCost) {
      return NextResponse.json(
        {
          error: `eSIMaccess balance is $${balanceUsd.toFixed(2)}, which is not enough for this package ($${supplierCost.toFixed(2)}). Top up first.`,
          balance: balanceUsd,
          supplierCost,
        },
        { status: 409 },
      );
    }
  } catch (e) {
    console.warn('[internal sale] Balance check failed, continuing', e);
  }

  // ── Resolve or create the customer ────────────────────────────
  let customer;
  let tempPassword: string | null = null;

  if (customerId) {
    customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 400 });
    }
  } else {
    const emailLower = email!.toLowerCase().trim();
    customer = await prisma.customer.findUnique({ where: { email: emailLower } });

    if (!customer) {
      // The modal asks for a name and a phone once it sees this
      if (!name || !phone) {
        return NextResponse.json(
          { error: 'CUSTOMER_NOT_FOUND', message: `No account exists for ${emailLower}.` },
          { status: 404 },
        );
      }
      const phoneTaken = await prisma.customer.findUnique({ where: { phone } });
      if (phoneTaken) {
        return NextResponse.json(
          { error: `This phone number is already registered to ${phoneTaken.email}.` },
          { status: 409 },
        );
      }
      tempPassword = generateTempPassword();
      customer = await prisma.customer.create({
        data: {
          email: emailLower,
          name,
          lastName: lastName || null,
          phone,
          password: await hash(tempPassword, 12),
          // The purchase email carries the temp password, and login blocks unverified
          // customers — without this flag that password would be unusable
          emailVerified: true,
        },
      });
    }
  }

  const customerFullName = [customer.name, customer.lastName].filter(Boolean).join(' ').trim()
    || customer.email;

  // ── The order row is written before any money moves ───────────
  let order;
  try {
    order = await prisma.order.create({
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customerFullName,
        status: 'PROCESSING',
        totalAmount: priceToCustomer,
        currency: 'USD',
        packageCode,
        packageName: pkg.name || packageCode,
        destination: pkg.location || pkg.locationCode || '',
        dataAmount: pkg.volume != null ? formatDataVolume(pkg.volume) : '',
        validity: pkg.duration != null ? `${pkg.duration} days` : '',
        supplierCost,
        source: 'ADMIN_INTERNAL',
        idempotencyKey,
        // The language the admin picked for this buyer, so a later resend matches the first send.
        locale: emailLocale,
        notes: paymentNote?.trim()
          ? `Internal sale by ${session!.user!.email} — ${paymentNote.trim()}`
          : `Internal sale by ${session!.user!.email}`,
        paidAt: new Date(),
      },
    });
  } catch (e) {
    // Two submits raced; the unique key won. Return whatever the first one produced.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const winner = await prisma.order.findUnique({ where: { idempotencyKey } });
      if (winner) {
        return NextResponse.json({ ok: true, alreadyExisted: true, order: shape(winner) });
      }
    }
    throw e;
  }

  // ── Buy it, then fetch the profile ────────────────────────────
  try {
    const purchase = await purchasePackage(packageCode, 1);
    await prisma.order.update({
      where: { id: order.id },
      data: { esimOrderId: purchase.orderNo, esimTransactionId: purchase.transactionId },
    });

    let profile;
    try {
      const result = await getEsimProfileWithRetry(purchase.orderNo, 5, 5000);
      profile = result?.esimList?.[0];
    } catch (profileErr) {
      // Money is spent and the batch id is recorded. PROCESSING, not FAILED, so nothing
      // invites a retry that would buy a second eSIM.
      const msg = profileErr instanceof Error ? profileErr.message : String(profileErr);
      const pending = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PROCESSING',
          errorMessage: `Purchased at eSIMaccess (batch ${purchase.orderNo}) but the profile has not arrived yet: ${msg}`.slice(0, 1000),
        },
      });
      createAuditLog({
        adminEmail: session!.user!.email!,
        adminName: session!.user!.name ?? '',
        action: 'INTERNAL_ESIM_SALE',
        targetType: 'Order',
        targetId: order.id,
        details: {
          orderNo: pending.orderNo, packageCode, packageName: pkg.name,
          priceToCustomer, supplierCost, customerEmail: customer.email,
          createdCustomer: tempPassword != null, outcome: 'profile_pending',
        },
      }).catch(() => {});
      return NextResponse.json({
        ok: true,
        pendingProfile: true,
        message: 'The eSIM was purchased but its profile has not arrived yet. It will appear on the order shortly — do not retry.',
        order: shape(pending),
      });
    }

    const completed = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        errorMessage: null,
        ...(profile && {
          iccid: profile.iccid,
          qrCodeUrl: profile.qrCodeUrl,
          smdpAddress: profile.smdpAddress,
          activationCode: profile.activationCode,
        }),
      },
    });

    // Ticket 039: awaited, and the outcome is returned so the agent knows if the buyer was told.
    let customerEmailSent = true;
    if (profile) {
      customerEmailSent = await sendPostPurchaseEmail(
        customer.email,
        {
          customerName: customer.name || customerFullName,
          planName: completed.packageName,
          dataGb: completed.dataAmount,
          validityDays: completed.validity,
          qrCodeUrl: profile.qrCodeUrl || null,
          smdpAddress: profile.smdpAddress,
          activationCode: profile.activationCode,
          loginLink: `${baseUrl()}/${toEmailLocale(emailLocale)}/account`,
          email: customer.email,
          tempPassword,
          orderNo: completed.orderNo,
          amountPaid: priceToCustomer,
          currency: completed.currency,
          orderDate: completed.paidAt ?? completed.createdAt,
          iccid: profile.iccid ?? null,
        },
        toEmailLocale(emailLocale),
      ).catch((e) => {
        console.error('[internal sale] Email send failed (non-fatal)', e);
        return false;
      });
      if (!customerEmailSent) {
        console.error('[internal sale] Post-purchase email was not accepted', { orderNo: completed.orderNo });
      }
    }

    createAuditLog({
      adminEmail: session!.user!.email!,
      adminName: session!.user!.name ?? '',
      action: 'INTERNAL_ESIM_SALE',
      targetType: 'Order',
      targetId: completed.id,
      details: {
        orderNo: completed.orderNo, packageCode, packageName: completed.packageName,
        priceToCustomer, supplierCost, margin: Number((priceToCustomer - supplierCost).toFixed(2)),
        customerEmail: customer.email, createdCustomer: tempPassword != null,
        emailLocale, outcome: 'completed',
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      order: shape(completed),
      createdCustomer: tempPassword != null,
      tempPassword,
      customerEmailSent,
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error('[internal sale] Purchase failed', order.id, errMsg);
    const failed = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FAILED', errorMessage: errMsg.slice(0, 1000) },
    });
    createAuditLog({
      adminEmail: session!.user!.email!,
      adminName: session!.user!.name ?? '',
      action: 'INTERNAL_ESIM_SALE',
      targetType: 'Order',
      targetId: order.id,
      details: {
        orderNo: failed.orderNo, packageCode, priceToCustomer, supplierCost,
        customerEmail: customer.email, outcome: 'failed', error: errMsg.slice(0, 300),
      },
    }).catch(() => {});
    return NextResponse.json({ error: errMsg, order: shape(failed) }, { status: 502 });
  }
}
