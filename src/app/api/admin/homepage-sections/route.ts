/**
 * Ticket 042 — admin toggles for homepage sections (Popular destinations, For you, the activation
 * badge) and the badge's wording per language.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { createAuditLog } from '@/lib/audit';
import { BADGE_TEXT_MAX, getHomepageSections, saveHomepageSections } from '@/lib/homepage-sections';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;
  return NextResponse.json(await getHomepageSections());
}

const badgeText = z.string().max(BADGE_TEXT_MAX).optional();
const bodySchema = z.object({
  popularDestinations: z.boolean(),
  forYou: z.boolean(),
  activationBadge: z.boolean(),
  activationBadgeText: z.object({ he: badgeText, en: badgeText, ar: badgeText, hi: badgeText }),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  await saveHomepageSections(parsed.data);
  createAuditLog({
    adminEmail: session!.user!.email!,
    adminName: session!.user!.name ?? '',
    action: 'UPDATE_HOMEPAGE_SECTIONS',
    targetType: 'SiteSetting',
    targetId: 'homepage_sections',
    details: parsed.data,
  }).catch(() => {});
  // What was actually stored (trimmed, empty languages dropped), so the admin shows the same.
  return NextResponse.json({ ok: true, ...(await getHomepageSections()) });
}
