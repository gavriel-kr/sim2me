# Ticket 039 — Architectural design

## Where this sits

The mail subsystem already has the shape we need: exactly one private funnel,
`sendEmail(to, subject, html, opts)` in `src/lib/email.ts`, which every one of the ~15
`sendXEmail` helpers ends up calling. Nothing bypasses it. That means the visibility half of
this fix lands in a single function, and no template is touched.

The delivery half is not in `email.ts` at all. It is in the call sites: each route starts the
send and then returns. So the fix is split cleanly:

```
src/lib/email.ts          →  make failure observable  (1 function)
src/app/api/**/route.ts   →  make completion guaranteed (11 call sites, one line each)
```

## Decision 1 — `await`, not `after()`

Next 15 offers `after()` from `next/server`, which exists precisely for post-response work and
which Vercel keeps the instance alive for. It is the fashionable answer and it was rejected.

`after()` still returns the response before the mail is sent, so the route can never know
whether the mail succeeded, which forecloses requirement 3 (tell the admin when a purchase
mail fails) and leaves us unable to surface anything to the caller. It also introduces a
second execution phase whose failure semantics differ per platform — the exact class of
platform-dependent behaviour that caused this incident in the first place.

`await` is boring, deterministic, identical locally and in production, and testable. The cost
is latency: roughly 300–800 ms added to a response that already includes a database write, and
on the webhook path, a response that already takes 30–70 seconds. For a payment path,
certainty is worth a fraction of a second.

## Decision 2 — parallel, then joined

The webhook can dispatch up to three mails on one code path. Awaiting them in sequence would
stack their latencies. Instead each send is started where it is started today — so the admin
notification still begins early and overlaps the eSIM provisioning — and the handler joins
them all immediately before returning:

```ts
const pending: Promise<unknown>[] = [];
// ... pending.push(someSend) at each existing site ...
await Promise.allSettled(pending);
return NextResponse.json({ received: true });
```

`allSettled` rather than `all`: a failed mail must never turn a captured payment into a
non-2xx response, which is what would make Paddle retry a transaction that has already been
fulfilled. This preserves today's "email failure is non-fatal" contract exactly, while
removing the freeze.

## Decision 3 — read the Resend result

Inside the funnel:

```ts
const { data, error } = await resend.emails.send({ ... });
if (error) {
  console.error('[Email] Resend rejected', { to, subject, name: error.name, message: error.message });
  return false;
}
console.log('[Email] sent', { to, subject, id: data?.id });
return true;
```

The success line is deliberate. The only reason this incident could be diagnosed at all is
that Resend keeps its own history; our own logs said nothing either way. A one-line record
with the Resend message id makes the next investigation a log search instead of an archaeology
project.

## Decision 4 — one alert, on the path where money already moved

Requirement 3 asks for an admin alert when a customer-facing mail fails. Rather than pushing
recipient-classification into the funnel — which would need to know which of its callers are
customer-facing — the alert is raised by the caller that cares. The purchase path already
checks nothing; it will now check the boolean it is already being handed:

```ts
const ok = await sendPostPurchaseEmail(...);
if (!ok) await sendCustomerEmailFailedAlert({ ... });
```

`sendCustomerEmailFailedAlert` is a new helper in `email.ts`, addressed with the existing
`adminRecipient()`, written in English like the other admin alerts, and carrying order number,
recipient and locale so the mail can be resent from the admin panel in one click. It reuses
the same funnel, so if Resend itself is down the alert fails too — accepted, since the
`console.error` above it is then the record of last resort.

## Decision 5 — nothing else changes

- No template, no copy, no subject line, no locale logic.
- No change to fulfilment order: provisioning still happens before any mail is sent.
- No new dependency.
- No schema change.
- `createAuditLog` left alone, per the PRD's out-of-scope list.

## Risk

| Risk | Mitigation |
|---|---|
| Webhook grows longer, Paddle times out | It already runs 30–70s; the duplicate guard already makes retries no-ops. `allSettled` keeps the response a 200 regardless. |
| A hanging Resend request now blocks a response | Resend's client has its own timeouts, and the funnel's `try/catch` already converts a throw into `false`. |
| Register/OTP responses feel slower | ~300–800 ms on a request that already writes to the database. The alternative is a user who never receives a code. |
| Regression in an untouched locale | Change is mechanical and locale-independent; all four locales verified after. |

## Files

| File | Change |
|---|---|
| `src/lib/email.ts` | Read Resend's `error`; log both outcomes; add `sendCustomerEmailFailedAlert` |
| `src/app/api/webhooks/paddle/route.ts` | Join all mail promises before returning; alert if the customer mail fails |
| `src/app/api/account/register/route.ts` | `await` the verification mail |
| `src/app/api/account/resend-verification/route.ts` | `await` |
| `src/app/api/account/otp/resend/route.ts` | `await` |
| `src/app/api/account/otp/disable/route.ts` | `await` |
| `src/app/api/contact/route.ts` | `await` both mails |
| `src/app/api/account/orders/[id]/retry/route.ts` | `await` |
| `src/app/api/admin/orders/[id]/retry/route.ts` | `await` |
| `src/app/api/admin/orders/[id]/refund/route.ts` | `await` |
| `src/app/api/admin/orders/[id]/cancel-esim/route.ts` | `await` |
| `src/app/api/admin/orders/internal/route.ts` | `await` |
| `src/app/api/cron/check-abandoned/route.ts` | `await` |
