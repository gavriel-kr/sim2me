/**
 * Prepare Paddle checkout: validate cart + traveler, return price IDs and custom_data.
 * Cart must have exactly one plan (single eSIM per checkout for fulfillment).
 */

import { NextResponse } from 'next/server';
import { getSessionForRequest, isCustomerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const prepareBodySchema = z.object({
  items: z.array(z.object({
    planId: z.string().min(1).max(128),
    quantity: z.number().int().min(1).max(10),
  })).min(1).max(1),
  customerEmail: z.string().email(),
  customerName: z.string().max(200).optional(),
  deviceType: z.string().max(64).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = prepareBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, customerEmail, customerName, deviceType } = parsed.data;
    const session = await getSessionForRequest(request);
    const userId = isCustomerSession(session) ? session.user.id : null;

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
          { error: 'Plan not available for checkout', planId: item.planId },
          { status: 400 }
        );
      }
      paddleItems.push({ priceId, quantity: item.quantity });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.sim2me.net';
    const successUrl = `${baseUrl}/success`;

    const customData: Record<string, string> = {
      planId: items[0].planId,
      customerEmail: customerEmail.trim().slice(0, 320),
      customerName: (customerName ?? '').trim().slice(0, 200),
    };
    if (deviceType) customData.deviceType = deviceType.trim().slice(0, 64);
    if (userId) customData.userId = userId;

    return NextResponse.json({
      items: paddleItems,
      customData,
      successUrl,
    });
  } catch (e) {
    console.error('[Checkout prepare]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
