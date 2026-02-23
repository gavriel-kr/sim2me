/**
 * Create Paddle checkout: either create a transaction with custom price (when PADDLE_API_KEY set)
 * or return catalog items (when paddlePriceId set in overrides). Single endpoint for both flows.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
});

const PADDLE_API = 'https://api.paddle.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, customerEmail, customerName, deviceType } = parsed.data;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string; type?: string } | undefined)?.type === 'customer'
      ? (session?.user as { id?: string })?.id ?? null
      : null;

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
      const amountCents = Math.round(item.unitPrice * 100);
      const amountStr = String(Math.max(1, amountCents));
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
          collection_mode: 'manual',
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
    const overrideMap = new Map(overrides.map((o) => [o.packageCode, o]));

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
