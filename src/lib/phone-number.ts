/**
 * Ticket 042 — telling a phone-plan order apart from the others.
 *
 * This file used to read the number from PikaSim and email it once it appeared. PikaSim does not
 * report the number, or any status, for phone plans (their API returns nulls; their docs say the real
 * number is only visible on the device), so on 2026-09-28 Gabriel had that removed: the customer is
 * told to find the number in the phone's settings, and nothing polls PikaSim for it. When a plan ends
 * is worked out from our own orders in `phone-validity.ts`.
 */

/** A PikaSim phone plan, or a renewal of one (same eSIM, same number). */
export function isPhoneOrder(packageCode: string | null | undefined): boolean {
  return Boolean(packageCode?.startsWith('pk:') || packageCode?.startsWith('rn:'));
}
