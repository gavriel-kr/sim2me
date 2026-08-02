# Ticket 032 — Sell an eSIM to a customer from the admin panel (PRD)

Requested by Gabriel, 2026-08-02. Scope cut back by him the same day — see "What was cut".

## The problem

There is one way for a customer to get an eSIM: pay through checkout on the website. That leaves no
answer for the cases Gabriel actually runs into — a deal agreed by phone, a support recovery, a
replacement, a customer who paid through another channel. Today all of them require sending the
person through a card payment at the public price, or doing nothing.

And when it is done outside the site, the price is not ours to choose. The amount on an order is
whatever Paddle charged.

## What we are building

A button on each package that sells that package to a customer at a price the admin sets.

The admin picks the package, types the customer's email, sets a price, confirms. The system buys the
eSIM from eSIMaccess — so the cost leaves the balance, as it would for any sale — and creates a
completed order attached to the customer's account, with the QR and activation details emailed to
them.

The outcome is indistinguishable, for the customer, from a normal purchase.

## Where it lives

| Starting point | Where the button is |
|---|---|
| From the product — "this package should go to someone" | eSIM Packages, in the Quick actions row of the package card |
| From the person — "this customer needs an eSIM" | Accounts, in the expanded customer panel |

Same modal both times. From Accounts the customer is already filled in; from Packages the package is.

## The customer

- Typing an email **autocompletes** against existing customers as you type.
- A match shows the name and phone beside it, so the right person is confirmed before money moves.
- No match says so plainly, and offers to create the account — first name, last name, phone.
- The phone field carries a **full country-code selector**, not an Israeli-only prefix.
- A new account gets a temporary password, emailed to the customer, and is marked email-verified.
  Without that flag the temporary password cannot be used, because login blocks unverified accounts.

## The price

One field, with a floor and no ceiling.

- **The floor is the supplier cost.** Below it the form does not submit. Free and symbolic prices are
  deliberately not available — this matches the rule the site already enforces on the public path,
  which blocks any payment under cost.
- **There is no upper limit.**
- The cost itself is never typed. It is whatever eSIMaccess charges, and it always comes off the
  balance, because this is a real purchase.
- The modal shows cost, the price being set, and the difference between them, live.

## Rules

- **Never buy twice.** A double-click, a browser retry or a resubmit must not produce two eSIMs. This
  is real money out of a prepaid balance, so the protection is enforced by the database, not by a
  disabled button.
- **Never buy blind.** The balance is checked before the purchase. Too low stops the action with a
  clear message rather than an opaque supplier error.
- **The order row is written before the purchase**, so a crash mid-way leaves a traceable record
  rather than a paid-for eSIM nobody knows about.
- **Restricted to SUPER_ADMIN and ADMIN**, in the UI and in the API. This action spends from the
  balance.
- **Every sale is logged** — who did it, for whom, which package, at what price and what cost.
- **The customer email always goes out**, with the QR, in a language the admin picks: Hebrew, English
  or Arabic.
- **Internal sales are tagged** in the orders list, so reporting can tell them from checkout sales.

## What was cut

Both cuts were Gabriel's call on 2026-08-02, after the first version of this plan came back too big.

- **Retroactive assignment of eSIMs already bought at eSIMaccess is out.** No sync from the supplier,
  no cron, no ICCID lookup, no button on the eSIMaccess Orders page, no change to the existing sync
  route. Purchases Gabriel makes directly at eSIMaccess are his own and stay outside the site.
- **The editable cost field is out**, because the price floor made it pointless. If the price can
  never go below cost, and the cost is always what the supplier actually charged, there is nothing to
  override. The loss warning and its confirmation checkbox go with it, replaced by plain validation.

## Out of scope

- Any change to the Paddle webhook, checkout, or public pricing.
- Any change to the customer portal. An internal order appears there on its own, because the portal
  reads a customer's orders without caring where they came from.
- Refunding an internal order through Paddle. There is no Paddle transaction; the existing refund
  action already declines cleanly, and cancelling the eSIM at the supplier already works.
- Changing the dashboard's profit formulas.
- A source filter on the orders list. The tag is enough to see it; filtering is a follow-up.
- Quantities above one, and top-ups.

## Acceptance

- From a package card, an existing customer's email, a price above cost, confirm → the eSIM is
  bought, the order shows as `COMPLETED` under that customer, and the customer receives the QR email.
- From a package card with an unknown email → the modal says no account exists, takes a name and a
  phone with any country code, creates the account, and the customer can log in with the temporary
  password they were emailed.
- From the customer card in Accounts → the same flow, customer pre-filled.
- A price below cost cannot be submitted, and is refused by the API even if the UI is bypassed.
- Submitting the same form twice produces one eSIM and one order.
- The balance drops by the supplier cost exactly once per sale.
- The order is tagged as internal in the admin orders list.
- A VIEWER or EDITOR admin cannot reach the action, in the UI or through the API.
- A real checkout purchase still fulfils and still emails, unchanged.
