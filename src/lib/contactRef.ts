/**
 * A human-quotable reference for a contact submission — `SM-XXXXXX`.
 *
 * Ticket 026. The database id is a cuid: correct for a database and useless over the phone. This
 * derives a short token from it so the same submission carries the same reference in the customer's
 * auto-reply, in the admin notification subject and in the admin list — which is what makes a reply
 * matchable by hand while there is no reply-from-admin screen.
 *
 * Deterministic and stateless on purpose: no column, no migration, and an old row gets a reference
 * retroactively. FNV-1a over the id, rendered base36 — six characters is roughly two billion values,
 * far more than a hand-answered mailbox will ever need, and a collision costs nothing because the
 * reference is always read next to an email address and a date.
 */
export function contactRef(id: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `SM-${hash.toString(36).toUpperCase().padStart(6, '0').slice(-6)}`;
}
