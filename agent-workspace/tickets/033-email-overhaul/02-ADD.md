# Ticket 033 — Architectural Design (ADD)

## Principles

- **One module keeps its job.** Every template already lives in `src/lib/email.ts` as inline HTML
  built by a function per email. That stays. Introducing a template engine or `@react-email` here
  would be a new dependency and a new pattern for a ticket whose job is to add fields and one email.
- **The webhook is edited, never restructured.** `src/app/api/webhooks/paddle/route.ts` is the
  highest-risk file in the repo. Changes to it are additive: three fields written to the order, one
  new call in a path that currently does nothing, and a wider argument object. No reordering of the
  fulfilment sequence, no extraction into helpers.
- **Additive schema only.** One nullable column. No rename, no drop, no retype.
- **Email failure never touches an order.** Every new send follows the existing convention —
  fire-and-forget with a caught rejection. A `COMPLETED` order stays `COMPLETED` if the mail fails.
- **Nothing new invented where something exists.** `toEmailLocale`, `escapeHtml`, `logoImgTag`,
  `getBalance`, `sendEmail` and the `POST_PURCHASE_COPY` shape are all reused as they are.

## 1. Schema — `prisma/schema.prisma`

```prisma
model Order {
  // ...
  locale String?  // buyer's checkout language, for any later resend
}
```

Nullable with no default, so existing rows are valid untouched and read as `null`. Every consumer
runs the value through `toEmailLocale()`, which already maps `null` to Hebrew — so behaviour for
historical orders is bit-for-bit what it is today, and only new orders gain the improvement.

Applied by `prisma db push`, approved by Gabriel, following the sequence ticket 032 used: the column
reaches the database first, the code that reads it deploys second. That order matters — the reverse
would put code in production querying a column that does not exist.

## 2. Email module — `src/lib/email.ts`

### `sendEmail` gains three optional arguments

```ts
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  opts?: { text?: string; replyTo?: string; attachments?: EmailAttachment[] },
): Promise<boolean>
```

Optional so all eleven existing call sites compile and behave identically. `text` and `replyTo` are
deliverability: an HTML-only body with no reply path is a spam signal, and a customer who hits reply
today reaches a `noreply` void.

### `PostPurchaseEmailData` gains the receipt fields

`orderNo`, `destination`, `amountPaid`, `currency`, `orderDate`, `iccid`, `orderUrl` — all optional.
Optional is what lets the five existing call sites be migrated one at a time and what keeps a caller
that cannot supply a field (the resend route has no live currency context, for instance) from being
forced to invent one. Any field absent is omitted from the rendered block rather than printed empty.

### New: `sendOrderDelayedEmail`

Same shape as the others — a `Record<EmailLocale, {...}>` copy table, `dir` and alignment derived
from the locale, `logoImgTag()` at the top, `sendEmail()` at the bottom. It deliberately does not
receive or render the error message: an English stack fragment inside a Hebrew apology helps nobody
and leaks internals.

### QR as an attachment as well as an image

`qrCodeUrl` is fetched server-side, with a timeout, and passed to Resend as an attachment beside the
existing `<img>`. If the fetch fails the email sends exactly as it does today. Considered and
rejected: generating the QR locally with the installed `qrcode` package. The supplier's PNG is the
authoritative artifact, and re-encoding an activation payload ourselves introduces a way to render a
QR that does not match the eSIM.

## 3. Characters — `public/characters/email/`

Six PNGs cut from the existing masters by a one-off script, checked in as ordinary assets.

**Why new files rather than the existing ones.** Outlook's desktop client renders through Word,
which supports neither AVIF nor WebP; Gmail's WebP support is partial. Every character asset in the
repo is AVIF plus WebP, so reusing them puts a broken-image icon in a paying customer's inbox.

**Why only pair poses.** Outlook ignores CSS `transform`, so the `mirror` mechanism that flips a
figure for RTL cannot work in an email. Pair poses face the camera or each other and have no
direction to be mirrored into, which makes the same file correct in all three locales.

**Why PNG and not JPEG.** The cutouts have an alpha channel; a JPEG would put a white box behind
each figure on any tinted background.

Sizing: max 320 px wide, rendered at 160 px, so they stay sharp on a retina phone. The email must
also stay under Gmail's 102 KB clipping threshold for the HTML body, which images do not count
toward — but the total message weight is kept in check anyway.

| Email | Pose | Placement |
|---|---|---|
| eSIM ready | `pair-checking-phone-v1` | Header — the pair delighted at a working phone |
| eSIM ready | `pair-explaining-v1` | Beside the install steps |
| Order delayed | `pair-reassuring-v1` | Header — open palm |
| Password reset | `pair-reassuring-v1` | Header |
| Verification | `simi-waving-v1` (pair-free exception, faces camera) | Header |
| OTP | `simi-waving-v1` | Header |

The brand rule in `agent-workspace/brand-assets/characters/README.md` excludes characters from error
states. The delayed-order email is a **deliberate exception**: `pair-reassuring-v1` was drawn for
exactly this — hand on chest, open palm — and a bare apology from a brand built on two friendly
faces reads colder than the situation warrants. Recorded so it is a decision and not a drift.

## 4. Call sites

Five callers of `sendPostPurchaseEmail`, each passing the new fields from data it already holds.

| File | Change |
|---|---|
| `api/webhooks/paddle/route.ts` | Persist `locale`; pass receipt fields; **send the delayed email** in the `firstProfile`-missing branch and in the `catch` |
| `api/admin/orders/[id]/retry/route.ts` | Pass `order.locale` and receipt fields |
| `api/account/orders/[id]/retry/route.ts` | Same |
| `api/admin/orders/[id]/resend-email/route.ts` | Same |
| `api/admin/orders/internal/route.ts` | Receipt fields; keeps its admin-chosen locale, which is correct — a phone sale has no browser locale to inherit |

`api/checkout/create-transaction/route.ts` is **not** touched. It already puts `locale` into
`custom_data`; the webhook simply stops throwing it away.

## 5. Admin balance

`getBalance()` from `src/lib/esimaccess.ts`, called in the webhook beside the existing admin
notification, wrapped so that neither a rejection nor a hang can reach the order:

```ts
const balance = await Promise.race([
  getBalance().catch(() => null),
  new Promise<null>((r) => setTimeout(() => r(null), 4000)),
]);
```

`null` renders as a dash. The supplier reports cents at `$1 = 10000`, the same conversion the admin
dashboard already applies. Below a threshold the figure renders red with a top-up prompt.

This value is passed only to `sendAdminOrderNotificationEmail`. It is not added to
`PostPurchaseEmailData`, so there is no type-level path by which it could reach a customer template.

## 6. Preview tooling — `agent-workspace/scripts/email-preview.mjs`

Renders every template in all three locales with fixture data. `--write` produces HTML files;
`--send <address>` posts them through Resend.

It lives in `agent-workspace/` rather than as a route under `src/`. `DEPLOY-READINESS.md` records
that the existing `design-preview` route is a standing hazard because one `git add -A` would put it
on the live site. A script in the workspace has no such failure mode.

## Risk: R3

`prisma/schema.prisma` changes, and the file set includes the Paddle webhook and every transactional
email — three separate R2 subjects on the protocol's own list.

Mitigations in the design rather than bolted on: the column is nullable so no existing row can be
invalidated; every new field is optional so no existing caller changes behaviour by omission; the new
email fires only in a branch that currently sends nothing at all, so it cannot displace a working
message; and the balance lookup is isolated behind a timeout on a path that already tolerates
failure.

## Deliberately not done

- **No email log table and no Resend webhooks.** Real gap, belongs with P2 where the volume makes
  measurement matter.
- **No move of email copy into `src/messages/*.json`.** Right eventually; a refactor of every
  template in a ticket that also changes the webhook is one risk too many.
- **No customer auto-reply on the contact form.** That is paused ticket 026.
- **No new dependency.** `sharp` is already present for the PNGs, `resend` handles attachments.
