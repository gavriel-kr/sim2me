/**
 * Create Paddle checkout: either create a transaction with custom price (when PADDLE_API_KEY set)
 * or return catalog items (when paddlePriceId set in overrides). Single endpoint for both flows.
 *
 * SECURITY: The unitPrice field from the client is intentionally ignored in the dynamic-pricing
 * path. The authoritative price is always resolved server-side from PackageOverride.customPrice
 * or the eSIMaccess DB cache. Clients cannot manipulate what they are charged.
 */

import { NextResponse } from 'next/server';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getDbCachedPackages } from '@/lib/packagesCache';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { verifyTurnstile } from '@/lib/turnstile';
// import { checkBotId } from 'botid/server'; // BotID disabled
import { z } from 'zod';

const bodySchema = z.object({
  items: z.array(z.object({
    planId: z.string().min(1).max(128),
    quantity: z.number().int().min(1).max(10),
    unitPrice: z.number().min(0),
    planName: z.string().max(300),
  })).min(1).max(1),
  customerEmail: z.string().email(),
  customerName: z.string().max(200).optional(),
  deviceType: z.string().max(64).optional(),
  turnstileToken: z.string().optional(),
});

const PADDLE_API = 'https://api.paddle.com';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit(ip, 'checkout', 10, 60);
    if (!allowed) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, customerEmail, customerName, deviceType, turnstileToken } = parsed.data;

    // Bot protection: verify Turnstile token before any business logic
    const turnstileOk = await verifyTurnstile(turnstileToken ?? '', ip);
    if (!turnstileOk) {
      return NextResponse.json({ error: 'Security check failed. Please refresh and try again.' }, { status: 400 });
    }

    const session = await getSessionForRequest(request);
    const userId = isCustomerSession(session) ? session.user.id : null;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.sim2me.net';
    const successUrl = `${baseUrl}/success`;

    const customData: Record<string, string> = {
      planId: items[0].planId,
      customerEmail: customerEmail.trim().slice(0, 320),
      customerName: (customerName ?? '').trim().slice(0, 200),
    };
    if (deviceType) customData.deviceType = deviceType.trim().slice(0, 64);
    if (userId) customData.userId = userId;

    const apiKey = process.env.PADDLE_API_KEY?.trim();

    if (apiKey) {
      const item = items[0];
      const planId = item.planId;

      // Resolve authoritative price server-side — never trust client-supplied unitPrice.
      // 1. Check PackageOverride: reject if explicitly hidden, use customPrice if set.
      const override = await prisma.packageOverride.findFirst({
        where: { packageCode: planId },
      });
      if (override?.visible === false) {
        return NextResponse.json(
          { error: 'Plan not available for checkout', planId },
          { status: 400 }
        );
      }

      let serverPrice: number;
      if (override?.customPrice != null) {
        serverPrice = Number(override.customPrice);
      } else {
        // 2. Fall back to eSIMaccess DB cache (retailPrice preferred, else wholesale price).
        const cached = await getDbCachedPackages();
        const pkg = cached?.packageList?.find((p) => p.packageCode === planId);
        if (!pkg) {
          return NextResponse.json(
            { error: 'Plan not available for checkout', planId },
            { status: 400 }
          );
        }
        serverPrice = pkg.retailPrice ? pkg.retailPrice / 10000 : pkg.price / 10000;
      }

      const amountCents = Math.round(serverPrice * 100);
      // Paddle minimum is 70 cents
      const amountStr = String(Math.max(70, amountCents));
      const name = item.planName.slice(0, 250) || 'eSIM';


      const res = await fetch(`${PADDLE_API}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          items: [
            {
              quantity: item.quantity,
              price: {
                description: name,
                name,
                unit_price: { amount: amountStr, currency_code: 'USD' },
                product: {
                  name,
                  tax_category: 'standard',
                  description: name,
                },
              },
            },
          ],
          currency_code: 'USD',
          custom_data: customData,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('[Paddle create transaction]', res.status, err);
        return NextResponse.json(
          { error: 'Payment provider error', details: err.slice(0, 200) },
          { status: 502 }
        );
      }

      const data = await res.json();
      const transactionId = data?.data?.id;
      if (!transactionId) {
        return NextResponse.json({ error: 'Invalid response from payment provider' }, { status: 502 });
      }

      return NextResponse.json({ transactionId, successUrl, mode: 'transaction' });
    }

    const planIds = items.map((i) => i.planId);
    const overrides = await prisma.packageOverride.findMany({
      where: { packageCode: { in: planIds }, visible: true },
    });
    const overrideMap = new Map<string, typeof overrides[number]>(overrides.map((o: typeof overrides[number]) => [o.packageCode, o]));

    const paddleItems: { priceId: string; quantity: number }[] = [];
    for (const item of items) {
      const override = overrideMap.get(item.planId);
      const priceId = override?.paddlePriceId?.trim();
      if (!priceId || !priceId.startsWith('pri_')) {
        return NextResponse.json(
          {
            error: 'Plan not available for checkout. Add PADDLE_API_KEY in .env to use dynamic pricing, or set Paddle Price ID in Admin → Packages for this plan.',
            planId: item.planId,
          },
          { status: 400 }
        );
      }
      paddleItems.push({ priceId, quantity: item.quantity });
    }

    return NextResponse.json({
      items: paddleItems,
      customData,
      successUrl,
      mode: 'items',
    });
  } catch (e) {
    console.error('[Checkout create-transaction]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
