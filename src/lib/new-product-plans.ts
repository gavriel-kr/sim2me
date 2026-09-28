/**
 * Ticket 042 — turn a day-pass choice or a phone plan into the `Plan` shape the cart already holds.
 *
 * The cart, the checkout summary and analytics all speak `Plan`. Building one here means none of
 * them needs a second code path; they only read the optional `kind` / `fairUse` / `phone` fields
 * where the wording has to differ.
 */

import type { Plan } from '@/types';
import type { UnlimitedOffer } from '@/lib/unlimited';
import type { PhonePlan } from '@/lib/phone-plans';
import { dayPassId } from '@/lib/product-id';

function networkOf(speed: string): Plan['networkType'] {
  if (speed.includes('5G')) return '5G';
  if (speed.includes('3G')) return '3G';
  return '4G';
}

export function dayPassToPlan(offer: UnlimitedOffer, days: number, destinationSlug: string, destinationName: string): Plan {
  return {
    id: dayPassId(offer.packageCode, days),
    destinationId: destinationSlug,
    name: `${destinationName} · Unlimited · ${days}`,
    dataAmount: -1,
    dataDisplay: 'Unlimited',
    days,
    price: offer.prices[days - 1],
    currency: 'USD',
    networkType: networkOf(offer.speed),
    speed: offer.speed,
    tethering: true,
    topUps: offer.topUp,
    operatorName: '',
    kind: 'daypass',
    fairUse: { dailyGb: offer.dailyGb, fupKbps: offer.fupKbps },
  };
}

export function phonePlanToPlan(plan: PhonePlan, destinationSlug: string): Plan {
  return {
    id: plan.id,
    destinationId: destinationSlug,
    name: plan.name,
    dataAmount: plan.dataGb * 1024,
    dataDisplay: `${plan.dataGb} GB`,
    days: plan.days,
    price: plan.priceUsd,
    originalPrice: plan.originalPriceUsd ?? null,
    currency: 'USD',
    networkType: networkOf(plan.speed),
    speed: plan.speed,
    tethering: true,
    topUps: false,
    operatorName: '',
    saleBadge: plan.saleBadge,
    kind: 'phone',
    phone: {
      region: plan.region,
      numberCountry: plan.numberCountry,
      dialCode: plan.dialCode,
      voiceMinutes: plan.voiceMinutes,
      sms: plan.sms,
      coverageCount: plan.coverageCount,
    },
  };
}

/** A renewal of an existing phone eSIM, as a cart line. Priced by the server (`/api/account/esims/renewal`). */
export function renewalToPlan(
  option: { id: string; name: string; dataGb: number; days: number; voiceMinutes: number | null; sms: number | null; priceUsd: number },
  ctx: { baseOrderId: string; phoneNumber: string | null; region: 'us' | 'europe' | 'global' | 'local' | null },
): Plan {
  return {
    id: option.id,
    destinationId: 'phone-renewal',
    name: option.name,
    dataAmount: option.dataGb * 1024,
    dataDisplay: `${option.dataGb} GB`,
    days: option.days,
    price: option.priceUsd,
    currency: 'USD',
    networkType: '4G',
    tethering: true,
    topUps: false,
    operatorName: '',
    kind: 'phone',
    phone: {
      region: ctx.region ?? 'us',
      numberCountry: 'US',
      dialCode: '+1',
      voiceMinutes: option.voiceMinutes ?? 0,
      sms: option.sms ?? 0,
      coverageCount: 0,
      renewalOf: { baseOrderId: ctx.baseOrderId, phoneNumber: ctx.phoneNumber },
    },
  };
}
