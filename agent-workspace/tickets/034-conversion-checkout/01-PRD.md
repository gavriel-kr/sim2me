# Ticket 034 — The funnel a Hebrew buyer can actually finish (PRD)

Requested by Gabriel, 2026-08-10, during the pre-launch review. Scope approved the same evening.

This is the first of four pre-launch work items. It owns the **path to payment**. The siblings are 026
(honest claims and support expectations — an existing paused ticket, re-cut rather than reopened as a
new number), 036 (technical clarity and the golden tip), and 037 (what happens after the money moves).

Two adjacencies were checked before this was written. Ticket 025 shipped the hero this ticket touches,
and its own record notes that the price anchor was removed there at Gabriel's request — the same call
is repeated below, so this ticket does not undo it. Ticket 027 (navy palette, paused) plans a colour
migration across `SearchDestination.tsx` and `CheckoutClient.tsx`; if it is ever resumed it will need
to be re-cut against the styling decided here.

## The problem

Four findings, in order of what they cost.

**1. The checkout is in English.** `CheckoutClient.tsx` carries sixteen hardcoded English strings
that never pass through `next-intl`: the empty-cart line, "Browse destinations", "Remove", both
minimum-purchase warnings, "Continue to details", "Continue to payment", "Summary", "Total",
"Continue", the day unit in the cart and the summary, and three error strings raised from the payment
handler. A visitor reads Hebrew on the homepage, picks a destination in Hebrew, adds to the cart in
Hebrew — and the interface switches language at the exact moment they are asked for a card. That is
the highest-anxiety screen in the product, and it is the one screen that stops looking local.

**2. Adding to the cart is a dead end.** Every route to purchase is add-to-cart; there is no
buy-now anywhere. The confirmation is a toast with a title and a description and **no action**, and
the only way to reach `/checkout` is to notice the cart icon in the header. A visitor with full
purchase intent is left to find the next step on their own.

**3. The price shown is not the price charged.** The summary renders a bare `Total` with no tax line,
while Paddle — the merchant of record — adds VAT inside its own overlay. The number grows at the last
step, which is one of the most reliable ways to lose a cart. Nothing on the page says the charge is
in US dollars either.

**4. There is no primary call to action.** The hero's search button and the "how it works" button
share a size, a shape, a weight and a row, so neither leads. The search button also duplicates what
Enter already does, and when the field is empty it navigates to the destinations list — a button
labelled "find" that finds nothing. Around them the hero offers, at once: an activation badge, a
rotating deal chip, a search field, a search button, a "continue to X" chip, up to six country
chips, a secondary button, and an offer card with two more actions.

And the search field itself does not read as a field. It is a pale blue border on a pale blue fill,
which is the visual language of a disabled input, and its border contrast almost certainly fails the
3:1 minimum for user-interface components.

## Standing constraints — Gabriel, explicitly

- **The hero headline stays exactly as it is** in all three languages: `Connected worldwide!` /
  `מחוברים בכל העולם!` / the Arabic equivalent. It is not to be rewritten, shortened or reworded.
- **No price anchor in the hero.** No "from $X", no "starting at", no equivalent phrasing anywhere in
  the headline or subtitle. This repeats the same call made in ticket 025.
- Local only. Nothing is deployed by this ticket.

## What we are building

### The checkout speaks the customer's language

Every hardcoded string becomes a `checkout.*` key in Hebrew, English and Arabic. No logic moves, no
field is added or removed, no request changes shape. `dir` already comes from `<html>` in the root
layout, so right-to-left needs no new plumbing — it needs the strings to exist.

One corrupted Hebrew string is fixed while we are in the file: `checkout.step2` currently reads
`הקש הוסף ח plan סלולרי`.

### Adding to the cart offers the next step

The existing toast gains an action button that navigates to `/checkout`, in all three places that add
to a cart — the hero offer card, the plan card, and the plan detail page. The toast lives longer than
the Radix default so there is time to read it and decide, and the header's cart badge is easier to
spot.

Deliberately **not** a cart drawer. A drawer is a new component, new state and a new failure surface
on the highest-value path in the product; the toast already exists, already renders, and already
supports an action. If measurement after launch shows the toast is not enough, the drawer is its own
ticket.

### The total tells the truth

Two short notes under the total: that the final amount including VAT is shown in the payment window,
and that the charge is in US dollars. A line at the payment step stating that payment is processed
securely by Paddle and that the eSIM is emailed immediately. And when Turnstile has not yet returned
a token, the disabled pay button gets a sentence explaining why instead of sitting there grey.

Displaying prices in shekels is **out of scope** — it needs a conversion source and a commercial
decision, and it is not a launch blocker.

### One call to action leads

"How it works" stops being a button and becomes a text link. The country chips are reduced. The
search field gets a white fill, a border that clears contrast, a real shadow, more height, and its
button moves inside it so the field and the action read as one control. The label on that button
changes from "find your eSIM" to wording that says where it goes.

While in the search component, four real defects get fixed: typing something with no match returns
silence with no message; matching runs only against the translated name, so `japan`, `usa` and
`italy` find nothing in Hebrew; there is no matching on ISO code or on the aliases Israelis actually
type; and regional destinations are filtered out of the autocomplete entirely, so `אירופה` returns
nothing even though regional bundles are on sale.

### Housekeeping in the same pass

The homepage's `Organization` JSON-LD publishes `gavriel.kr@gmail.com` as the company's customer
service address and claims a Twitter profile that `brandConfig` says does not exist. The closing CTA
sends visitors to the same destinations list the hero already sent them to.

## Security posture — required by Gabriel

This ticket touches the checkout file, so the constraint is stated as a requirement rather than an
assumption. **Nothing in this ticket may widen the attack surface.** Specifically:

- No change to `create-transaction`, to the Paddle webhook, or to server-side price resolution. The
  server keeps deciding what a plan costs.
- No change to Turnstile: it stays mandatory, the pay button stays disabled without a token, and the
  widget still resets after an attempt. The only addition is explanatory text.
- No new form field, no new query parameter, no new endpoint, no new dependency.
- All new copy renders as text through `next-intl`. No `dangerouslySetInnerHTML`, no interpolation of
  user input into markup.
- The toast's action navigates to a fixed internal route through the existing locale-aware `Link`.
  No user-supplied destination, so no open-redirect surface.
- Search matching stays entirely client-side over a list the site already fetches. Adding alias
  matching adds no request and no user input reaches a server.

## Out of scope

- Removing the first and last name fields from checkout. It changes what is sent to Paddle, so it
  needs its own approval and its own verification.
- Email capture, the unrendered newsletter section, abandoned-cart mail to the customer, and
  collecting social proof. All post-launch.
- Prices in shekels.
- A cart drawer.
- Everything owned by 035, 036 and 037.

## Acceptance

- No English string appears anywhere in the checkout in Hebrew or Arabic, at any of the three steps,
  including the empty cart, both minimum-purchase warnings and every error path.
- Adding to a cart from the hero card, a plan card or the plan detail page produces a toast with a
  working button to the checkout.
- The summary states that VAT is added in the payment window and that the charge is in dollars.
- A disabled pay button is always accompanied by a reason.
- The hero has exactly one button-weight call to action.
- The search field reads as an input on first glance, and its border passes 3:1 contrast.
- `japan`, `usa`, `ארה"ב` and `אירופה` all return results in the Hebrew autocomplete; a nonsense
  string returns a visible "nothing found" row.
- The homepage JSON-LD carries `info@sim2me.net` and claims no profile that does not exist.
- `tsc`, lint and `next build` are clean, and the hero headline is byte-identical to what it was.
