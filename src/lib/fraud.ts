/**
 * Fraud detection helpers — auto-blocking logic.
 * All functions are safe to call fire-and-forget: they never throw.
 */
import { prisma } from '@/lib/prisma';

export type BlockType = 'IP' | 'EMAIL';

/** Upsert a blocked item. Safe to call multiple times (idempotent). */
export async function autoBlock(
  type: BlockType,
  value: string,
  reason: string,
): Promise<void> {
  if (!value || value.trim() === '') return;
  const v = value.trim().toLowerCase();
  try {
    await prisma.blockedItem.upsert({
      where: { type_value: { type, value: v } },
      update: { reason, autoBlocked: true },
      create: { type, value: v, reason, autoBlocked: true },
    });
  } catch (e) {
    console.error('[fraud] autoBlock failed', { type, value: v, e });
  }
}

/**
 * Check if an email has accumulated 3+ FAILED orders in the last 24 hours.
 * If yes, auto-block the email.
 */
export async function checkAndAutoBlockEmail(email: string): Promise<void> {
  if (!email) return;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    const count = await prisma.order.count({
      where: {
        customerEmail: email.toLowerCase(),
        status: 'FAILED',
        createdAt: { gte: since },
      },
    });
    if (count >= 3) {
      await autoBlock('EMAIL', email, `Auto-blocked: ${count} FAILED orders in 24h`);
    }
  } catch (e) {
    console.error('[fraud] checkAndAutoBlockEmail failed', { email, e });
  }
}

/** Returns true if the given type+value is on the blocklist. */
export async function isBlocked(type: BlockType, value: string): Promise<boolean> {
  if (!value) return false;
  try {
    const item = await prisma.blockedItem.findUnique({
      where: { type_value: { type, value: value.trim().toLowerCase() } },
      select: { id: true },
    });
    return item !== null;
  } catch {
    return false;
  }
}
