# Ticket 039 — Email delivery guarantee

## The incident that opened this

14 Aug 2026. A real purchase from `/hi` by `gavriel.kr@gmail.com`, order `Azerbaijan 500MB 7Days`, $1.88.

| Event | Time (UTC) |
|---|---|
| Order row created, payment captured | 04:41:14 |
| Admin "New Order" mail delivered to `info.sim2me@gmail.com` | 04:41:15 |
| Customer reports no mail | ~04:46 |
| Customer's eSIM mail actually delivered | **04:49:58** |

The mail was not lost. It was **8 minutes 43 seconds late**, and it arrived three minutes
*after* the customer had already complained. Resend reports `last_event: delivered`, so
nothing was rejected — the send simply started very late.

This was not caused by Hindi. The same customer's 3 Aug order, in Hebrew, was created at
18:18:46 and its mail went out at 18:21:41 — **2 minutes 55 seconds late**. The defect has
been shipping quietly for as long as the webhook has existed. It surfaced now only because
this time somebody was watching the clock.

## Root cause

Every transactional mail in the codebase is dispatched as a floating promise and the route
then returns its response immediately:

```ts
sendPostPurchaseEmail(customerEmail, { ... }, emailLocale).catch((e) => console.error(...));
// ...
return NextResponse.json({ received: true });
```

On Vercel, the instance is frozen the moment the response is flushed. The HTTP request to
Resend that had just been started is suspended mid-flight. It resumes only when that same
instance happens to be thawed for a later request — which is why the delay is arbitrary:
2m55s once, 8m43s another time. **If the instance is recycled instead of thawed, the mail is
lost outright and nothing anywhere records that it happened.**

The admin notification escapes this because it is started early, near the top of the
handler, and has the remaining 30–70 seconds of eSIM provisioning to finish inside. The
customer's mail is started on the last line before the response, so it is always the one
that gets frozen. Hence the exact shape of the complaint: **admin notified, customer
silent.**

## Second defect, found while investigating

`resend.emails.send()` in SDK 6.x does not throw on an API error. It resolves with
`{ data: null, error: {...} }`. Our funnel ignores the `error` field entirely:

```ts
await resend.emails.send({ ... });
return true;
```

So any mail Resend refuses — quota, suppression, invalid recipient, malformed attachment —
is reported to the rest of the application as a success. We have had **zero** visibility
into email failures. Every "the customer didn't get it" report so far has been unfalsifiable.

## Scope of the first defect

The floating-promise pattern is not confined to the purchase mail. Present in:

| Route | Mail at risk | Cost of loss |
|---|---|---|
| `webhooks/paddle` | eSIM delivery, delayed, failed, fraud alert | Customer paid and hears nothing |
| `account/register` | Email verification | Cannot finish signing up |
| `account/resend-verification` | Email verification | Same, after asking again |
| `account/otp/resend` | Login OTP code | **Cannot log in** |
| `account/otp/disable` | OTP disable code | Locked out of a security setting |
| `contact` | Auto-reply + admin notification | Support request vanishes |
| `account/orders/[id]/retry` | eSIM delivery after retry | Paid, retried, still silent |
| `admin/orders/[id]/retry` | eSIM delivery after retry | Same, agent-initiated |
| `admin/orders/[id]/refund` | Refund confirmation | Money moved, no record sent |
| `admin/orders/[id]/cancel-esim` | Cancellation notice | No record sent |
| `admin/orders/internal` | eSIM delivery for internal sale | Same as purchase |
| `cron/check-abandoned` | Abandoned-checkout digest | Silent revenue loss |

## Requirements

1. A transactional mail must be fully handed to Resend **before** the route returns. No mail
   may depend on a frozen instance being thawed.
2. A rejection from Resend must be logged with recipient, subject and reason, and must be
   reported to the caller as a failure.
3. When a **customer-facing** mail on the purchase path fails, the admin must be told without
   waiting for the customer to complain.
4. No change to any mail's content, wording, language or template. This ticket changes
   delivery mechanics only.
5. No change to payment capture, fulfilment order, or eSIM provisioning logic.

## Explicitly out of scope

- `createAuditLog(...)` calls share the same floating-promise flaw. Admin-only, no customer
  impact, and touching a dozen more files widens the blast radius of a fix that has to ship
  tonight. Recorded here so it is not forgotten.
- Redesigning the webhook so provisioning happens outside the request. The handler can run
  30–70 seconds waiting for an eSIM profile, which is almost certainly long enough for Paddle
  to time out and retry; the duplicate guard makes those retries harmless today. A queue is
  the right long-term answer and is a ticket of its own.
- Paddle overlay language, still English for Hindi buyers (ticket 038 decision).

## Success criteria

- A purchase produces the customer's eSIM mail within seconds, not minutes.
- A forced Resend rejection appears in the logs and returns `false`.
- `/en`, `/he`, `/ar`, `/hi` all still send the same mail they sent before, unchanged.
