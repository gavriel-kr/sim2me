# Ticket 037 — Nobody pays and ends up with nothing (PRD)

Requested by Gabriel, 2026-08-10, during the pre-launch review. Fourth of four pre-launch work items.
Siblings: 034 (path to payment), 026 (honest claims, paused, to be re-cut), 036 (technical clarity).

This ticket touches the Paddle webhook, the checkout, and the retry endpoints. **It is the one ticket
in the set that changes money-path logic, and it does not begin without Gabriel's explicit approval per
the safety protocol.**

## What is already handled — the delta this ticket adds

Ticket 033 shipped on 2026-08-03 and closed the worst of it: a customer whose provisioning fails now
receives a localized delayed-order email, the purchase email is a receipt, and `Order.locale` survives
the transaction. Ticket 032 shipped internal admin sales and, in doing so, established the right
pattern for a pending profile — leave the order `PROCESSING` rather than `FAILED`, precisely so a retry
cannot accidentally buy a second eSIM. Ticket 015 shipped manual admin refunds.

What remains is the set below. Each item is a gap those tickets did not close.

## The problem

**1. No consent is captured at the moment of purchase.** The checkout has no terms acceptance and no
acknowledgement that a digital product is delivered immediately. Meanwhile the published refund policy
says an eSIM is non-refundable once installed or activated. Relying on that against an EU consumer
requires express consent to immediate delivery and an acknowledgement of losing the withdrawal right.
Today there is nothing to point at — not in the UI, not on the order, not in the transaction record.
This is the item that makes the rest of the refund policy enforceable, and it is the reason this ticket
is a launch gate rather than a cleanup.

**2. An order can be marked COMPLETED with no eSIM in it.** In the webhook, when the supplier purchase
succeeds but the profile comes back empty, the order is set to `COMPLETED` and the delayed email is
sent. The customer therefore sees a completed order, and a success page whose manual-install block has
nothing in it. Ticket 032 already decided the opposite behaviour for internal sales; the Paddle path
never got the same treatment.

**3. A `PROCESSING` order is invisible and unexplained.** In the account area it renders as a status
badge and nothing else — no sentence saying the eSIM is being prepared, no way to refresh, and no
appearance at all in the "My eSIMs" view, which filters to `COMPLETED`. Someone who has paid and whose
fulfilment is mid-flight, or stalled, is shown a label and left to interpret it. The success page polls
for about two minutes and then hands them to that same account page.

**4. Both retry paths can buy a second eSIM at the supplier.** The admin retry and the customer's own
retry call `purchasePackage` again without checking whether `esimOrderId` is already set. If the first
purchase succeeded and only the profile fetch failed — the exact scenario that produces a stuck order —
retrying pays the supplier twice for one sale. Ticket 032's own DIP records this as an open follow-up
for Paddle orders.

**5. Paddle refunds and chargebacks never reach the database.** The webhook handles
`transaction.completed` and acknowledges everything else. A refund issued from the Paddle dashboard, or
a chargeback, leaves the order reading `COMPLETED` forever, so admin figures and customer history both
lie.

## What we are building

- **Consent at checkout**, as a required checkbox with links to the terms and the refund policy, and an
  explicit acknowledgement of immediate delivery. Enforced on the server as well as in the UI, so it
  cannot be skipped by a crafted request, and recorded with the transaction so there is evidence
  afterwards.
- **A `PROCESSING` order stays `PROCESSING`** until there is a profile to show. `COMPLETED` starts to
  mean what it says.
- **A visible, explained pending state** in the account area, including in the eSIM view, with a way to
  check again.
- **A guard in both retry paths**: if the supplier order already exists, re-fetch the profile instead of
  buying again.
- **Refund and chargeback events reflected** on the order.

## Deliberately not automating refunds

An automatic refund on provisioning failure is rejected for launch. The failure modes it is supposed to
cover are rare, the correct response sometimes is to complete the order rather than reverse it, and an
automated money-reversal path is a far larger risk than the problem it solves at this volume. The
answer at launch is an alert that Gabriel actually sees, plus the manual refund that ticket 015 already
shipped.

The underpayment guard keeps its current behaviour — admin alerts only, no customer email — which was
Gabriel's explicit call in ticket 033. It is restated here so it is not "fixed" by accident while this
ticket is in the same file.

## Security requirements — Gabriel, explicitly

- The consent flag must be **server-enforced**. A request without it is rejected before a transaction
  is created; the checkbox is a convenience for humans, not the control.
- No weakening of Turnstile, of the rate limit, of the webhook signature check, of the replay window,
  or of server-side price resolution.
- The retry guard must not become a way to re-trigger fulfilment on an order that is already complete,
  and must not relax the existing authorisation checks on either retry endpoint. A customer may only
  ever act on their own order.
- New webhook events must be verified by the same signature path as the existing one, must be
  idempotent, and must never be able to *create* an order or move one to `COMPLETED`.
- No new endpoint is introduced. No new dependency.

## Out of scope

- Automatic refunds (above).
- Any change to pricing, to the fraud/blocklist behaviour, or to authentication.
- Abandoned-cart mail to the customer.
- The `PROCESSING`-order sweeper cron. Worth having later; at launch volume, an alert plus a daily look
  is enough, and a background job that mutates orders is not something to add in the same week as
  everything else.

## Acceptance

- A checkout cannot proceed without consent, in the UI and against a direct API call.
- Evidence of that consent is retrievable for a given order after the fact.
- An order with no profile is never `COMPLETED`; the customer still receives the delayed email.
- A pending order is visible and explained in the account area and in the eSIM view, in all three
  languages, with a way to re-check.
- A retry on an order that already has a supplier order does not buy a second one — proven by log, not
  by reading the code.
- A refund issued in Paddle is reflected on the order.
- Underpayment behaviour is byte-identical to today.
- `tsc`, lint, `next build` clean; a real end-to-end paid test passes, and a deliberately failed
  fulfilment produces the delayed email, the admin alert, and an order that is not `COMPLETED`.
