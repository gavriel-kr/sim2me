# ADD — Ticket 026: Support Readiness

## Architecture Overview

No new dependencies. No schema change. No new routes.

The customer-facing auto-reply is added to `src/lib/email.ts` as `sendContactAutoReplyEmail()`, following the exact pattern already used by `sendPasswordResetEmail` and `sendPostPurchaseEmail`: a `Record<EmailLocale, {...}>` copy map, `dir` derived from locale, HTML assembled inline, dispatched through the shared `sendEmail()` helper.

The admin notification stays where it is, inline in `src/app/api/contact/route.ts`. It is admin-only, already written, and only needs three small edits (phone row, reference, urgency prefix) plus a recipient fix. Moving it to `email.ts` would be a larger diff for no behavioural gain.

Copy changes are message-catalog edits only — no component logic changes for the SLA strings, because `Hero.tsx`, `TrustStrip.tsx` and `contact/page.tsx` already read them through `t()`.

```
POST /api/contact
  ├─ rate limit (existing)          blocking
  ├─ Turnstile verify (existing)    blocking
  ├─ zod validate (existing)        blocking
  ├─ prisma.contactSubmission.create → id          blocking   ← source of the reference
  ├─ admin notification  (edited, inline)          fire-and-forget
  └─ customer auto-reply (new, email.ts)           fire-and-forget
```

Both sends become fire-and-forget so a Resend outage can never turn a successfully-stored submission into a 500 for the customer. Today the admin send is awaited, which means a Resend failure loses the submission from the user's point of view even though it is safely in the database.

---

## Locale propagation

The route has no locale today. Following the precedent of `turnstileToken` — read off the raw body, not part of `contactFormSchema` — the client sends `locale` from `useLocale()` and the route normalises it with the existing helper:

```ts
const locale = toEmailLocale(body?.locale);
```

`toEmailLocale` (`src/lib/email.ts:46`) already validates against `'he' | 'en' | 'ar'` and falls back to `'he'`. The zod schema is untouched.

---

## Reference number

```ts
// src/lib/contactRef.ts (new, ~3 lines)
export function contactRef(id: string): string {
  return `SM-${id.slice(-6).toUpperCase()}`;
}
```

A tiny shared module rather than a duplicated inline expression, because the same string must appear in three places: the auto-reply, the admin notification, and the admin inbox row. Derived from the existing `cuid` primary key — no column added, no migration, no backfill, and it works retroactively for submissions already in the table.

---

## New in `src/lib/email.ts`

### `sendContactAutoReplyEmail(data, locale)`

```ts
type ContactAutoReplyData = {
  to: string;
  name: string;
  subject: string;   // canonical English value from CONTACT_SUBJECTS
  ref: string;
};
```

- Copy map `CONTACT_AUTOREPLY_COPY: Record<EmailLocale, {...}>` — greeting, body, SLA line, reference label, sign-off.
- Subject-specific help block resolved from a `Record<subject, {labelKey, href}[]>` map keyed on the canonical English subject values in `CONTACT_SUBJECTS` (`src/lib/validation/schemas.ts`), with link paths prefixed `/{locale}`.
- Localised subject line, e.g. `Sim2Me — קיבלנו את הפנייה שלך (SM-K3F9QA)`.
- Reuses `logoImgTag()` and `baseUrl()`.
- Returns `Promise<boolean>`, same as its siblings.

### `sendEmail()` — one optional parameter

```ts
async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean>
```

Passed through to `resend.emails.send({ ..., ...(replyTo ? { replyTo } : {}) })`. Backwards compatible — all nine existing call sites are unaffected. Needed so the auto-reply's Reply button lands in the real support mailbox rather than the no-reply sender.

---

## Changes in `src/app/api/contact/route.ts`

| Current | Change |
|---|---|
| `create({...})` result discarded | Capture the row; derive `ref = contactRef(row.id)` |
| `to: ['gavriel.kr@gmail.com']` | `process.env.ADMIN_NOTIFICATION_EMAIL \|\| 'info.sim2me@gmail.com'` — the pattern used by all seven admin emails in `email.ts` |
| `subject: '[Sim2Me Contact] ${subject}'` | `${urgent ? '[URGENT] ' : ''}[Sim2Me] ${subject} — ${ref}` |
| No phone in the HTML | Phone row added, rendered as a `tel:` link |
| No reference, no deep link | Reference row + link to `/admin/contact` |
| `await resend.emails.send(...)` | Fire-and-forget `.catch(console.error)` |
| Early `return` when `RESEND_API_KEY` is unset | Unchanged — dev path still logs and returns success |

`escapeHtml` already exists in this file and is applied to every interpolated value; the phone and reference rows follow suit.

Urgency is a module-level constant in the route:

```ts
const URGENT_SUBJECTS = new Set([
  'Activation Issue', 'Connectivity Problem', 'Refund Request', 'Billing & Payment',
]);
```

Values match `CONTACT_SUBJECTS` exactly, so a future subject added to the schema simply defaults to normal priority.

---

## Copy changes (message catalogs)

`src/messages/{he,en,ar}.json` — no new keys except one:

| Key | Action |
|---|---|
| `home.trustSupport` | Replace the 24/7 claim |
| `contact.responseTime` | Replace "within a few hours" |
| `contact.messageSentDesc` | Mention the confirmation email and the reference |
| `contact.refSent` | **New** — reference line shown on the success screen |

`ContactForm.tsx` gains two small things: `useLocale()` passed in the POST body, and the returned reference rendered on the success screen. `Hero.tsx`, `TrustStrip.tsx` and `contact/page.tsx` need no code change.

For the success screen to show the reference, `POST /api/contact` returns `{ success: true, ref }`.

---

## Support address consolidation

Pending Gabriel's confirmation of the live mailbox (see PRD open decision). Once confirmed, one value flows everywhere:

| File | Current | Action |
|---|---|---|
| `src/config/brand.ts` | `supportEmail: 'info@sim2me.net'` | Single source of truth |
| `prisma/seed.ts` | `support_email: 'support@sim2me.net'` | Align to brand config |
| `src/app/[locale]/account/AccountClient.tsx` | hardcoded `support@sim2me.net` mailto ×2 | Import from `brandConfig` |
| `src/content/policies.ts` | `info@sim2me.net` | Verify only |

`contact/page.tsx` already resolves `siteSetting.support_email` with `brandConfig.supportEmail` as fallback — that logic is correct and stays.

The DB row for `support_email` may already hold the old value in the local database; the DIP includes a check-and-update step, since editing the seed alone does not change an existing row.

---

## Files touched

| File | Change |
|---|---|
| `src/lib/contactRef.ts` | **NEW** — reference formatter |
| `src/lib/email.ts` | `sendContactAutoReplyEmail` + copy map + optional `replyTo` on `sendEmail` |
| `src/app/api/contact/route.ts` | Reference, phone, urgency, recipient, fire-and-forget, return `ref` |
| `src/app/[locale]/contact/ContactForm.tsx` | Send `locale`, show `ref` on success |
| `src/messages/he.json` | 3 edited keys + 1 new + auto-reply copy |
| `src/messages/en.json` | same |
| `src/messages/ar.json` | same |
| `src/app/admin/contact/ContactSubmissionsClient.tsx` | Display the reference on each row |
| `src/config/brand.ts` | Confirm single support address |
| `prisma/seed.ts` | Align `support_email` default |
| `src/app/[locale]/account/AccountClient.tsx` | Use `brandConfig.supportEmail` |

**No new dependencies. No schema change. No new API routes.**

Auto-reply copy lives in `email.ts` alongside the other email copy maps, not in the `next-intl` catalogs, because that is where every other transactional email keeps its strings and the server-side email path never loads the request-scoped translator.
