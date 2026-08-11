# Ticket 034 — Architectural Design (ADD)

## Principles this follows

There is no `architecture.md` in the repository; the conventions below are the ones the codebase
already demonstrates, and this ticket adds nothing new to them.

| Convention | Where it is already established | How this ticket follows it |
|---|---|---|
| All user-facing copy lives in `src/messages/{he,en,ar}.json` and is read with `useTranslations` | Every page component | Sixteen hardcoded strings move into `checkout.*` |
| Locale-aware navigation via `createSharedPathnamesNavigation(routing)` | `Header`, `Hero`, `PlanCard`, `CTASection` | The toast action reuses the same `Link`/`useRouter` |
| Direction comes from `<html dir>` in the root layout | `src/app/layout.tsx:179` | No new `dir` handling anywhere |
| Cart state is a persisted Zustand store, read with selectors | `src/stores/cartStore.ts` | Untouched |
| Toasts come from `useToast` + the Radix wrapper in `components/ui/toast.tsx` | `PlanCard`, `useAddDeal`, `PlanDetailClient` | The existing `action` slot is used; no new toast system |
| Server owns price; the client's `unitPrice` is advisory | `api/checkout/create-transaction/route.ts:5-7,90-116` | Untouched |

**The smallest-footprint rule drives every choice below.** This is the money path; the correct
architecture here is the one that changes the least.

## The four decisions

### 1. Strings, not structure, in the checkout

`CheckoutClient.tsx` keeps its three-step state machine, its `react-hook-form` wiring, its Turnstile
gate and its Paddle handler exactly as they are. The only edits are `'literal'` → `t('key')`, plus
three additions that render text and nothing else: the VAT note, the currency note and the Turnstile
explanation.

Two of the sixteen strings are raised from inside the payment handler rather than from JSX
(`CheckoutClient.tsx:74` and `:121`). Those become `t(...)` calls too — `useTranslations` is already
in scope at the top of the component, so no plumbing is needed.

The day unit appears twice, as `days` in the cart line and `d` in the summary line. The cart line
reuses the existing `plan.days`; the summary gets a new `checkout.daysShort`, because a summary row
is width-constrained and the full word does not belong there.

**Rejected:** extracting the checkout into smaller components while we are in the file. It would be a
better file afterwards and a worse ticket — a refactor of the payment screen cannot be verified by
reading a diff of string replacements.

### 2. The toast's existing `action` slot, not a cart drawer

`useToast.ts:13` already types `action?: ToastActionElement`, `toaster.tsx:24` already renders it, and
`toast.tsx:59` already exports a styled `ToastAction`. The whole feature is a `ToastAction` element
passed by three existing call sites. No new component, no new state, no new route.

Duration is passed per toast rather than changed globally. `useToast` sets no duration, so Radix's
5000 ms default applies; `TOAST_REMOVE_DELAY` in `useToast.ts:7` is the removal delay *after*
dismissal, not the visible lifetime, so raising it would not help. Because `props` spread onto
`ToastPrimitives.Root`, passing `duration: 9000` on the add-to-cart toasts alone leaves every other
toast in the product untouched.

The three call sites are `useAddDeal.ts:34`, `PlanCard.tsx:108` and `PlanDetailClient.tsx:167`. They
are left as three call sites rather than unified into one hook: `useAddDeal` already exists precisely
to share the hero-card and deals-row path, and the other two build their description from different
sources. Merging them is a refactor with no user-visible gain.

**Navigation safety.** The action navigates to the constant `'/checkout'` through the locale-aware
`Link`. No value from the deal, the plan, the cart or the URL takes part in the destination, so there
is no path for a crafted input to redirect a buyer somewhere else.

### 3. Honest totals as static copy, not as a computed tax figure

The summary gains two note lines. It does **not** attempt to compute VAT.

Computing it would mean either hardcoding rates per country, or asking Paddle for a preview quote
before the overlay opens — a new server call, on the money path, whose failure mode is a checkout
that will not load. Paddle is the merchant of record and already shows the exact taxed total in its
own overlay; the honest fix is to say so before the number changes, not to duplicate Paddle's tax
engine. Same reasoning for the currency note.

### 4. The search field keeps its component boundary

`SearchDestination` is rendered in exactly one place, `Hero.tsx:151`, which was verified before any
styling decision. So the restyle is contained: no other surface can regress.

Matching changes stay client-side over the list the component already fetches once from
`/api/packages` and caches for five minutes. Three additions:

- keep the original English `name` beside the translated one on `DestOption`, and match either
- match `locationCode` as well, so `jp` or `IL` resolves
- a small alias table for the strings an Israeli visitor actually types (`ארה"ב`, `ארהב`, `אמריקה`,
  `אנגליה`), kept in the component next to the matcher rather than in a new lib file, because it is
  presentation-layer input tolerance and nothing else consumes it

Regional destinations stop being filtered out at fetch time (`SearchDestination.tsx:56`). Selecting
one navigates by the same `slug`-from-`locationCode` rule as any other row, which is the rule the
destinations route already serves — this needs confirming against one regional row on localhost before
the filter is removed, and that check is a step in the DIP.

The "nothing found" row replaces the current silence. `open` currently derives from
`suggestions.length > 0` (`:88`), so the condition becomes "the query is non-empty", and the list
renders either rows or one non-interactive message.

## Security review of this ticket

The requirement in the PRD is that nothing here widens the attack surface. Concretely:

| Surface | Change | Assessment |
|---|---|---|
| `api/checkout/create-transaction` | none | Price still resolved server-side; request body shape unchanged |
| `api/webhooks/paddle` | none | Not opened by this ticket |
| Turnstile | explanatory text only | Still required; button still gated on the token; `turnstileRef.reset()` still runs in `finally` |
| Form fields | none added or removed | No new input reaches a server |
| New endpoints / dependencies | none | — |
| Rendering | `t()` output as text nodes | No `dangerouslySetInnerHTML`; no HTML built from data |
| Toast action target | constant internal route | No open redirect |
| Search | client-side matching over an already-fetched list | No new request; no user input crosses a trust boundary |
| Error messages | English literals become localized strings | Message content stays generic; no server detail is newly exposed. `data.details` is already rendered today and is left exactly as-is |
| JSON-LD | replaces a personal Gmail with the support mailbox, drops a false `sameAs` | Reduces disclosure |

Phishing-adjacent note, deliberate: the new payment-step line names Paddle as the processor. That
strengthens rather than weakens the buyer's ability to recognise a legitimate charge, because the
descriptor they will later see on their statement is Paddle's.

## Files and blast radius

| File | Change | Risk |
|---|---|---|
| `src/app/[locale]/checkout/CheckoutClient.tsx` | strings + three text additions | Low — display only, on a critical path |
| `src/messages/he.json`, `en.json`, `ar.json` | new `checkout.*` and `plan.*` keys; one corrupted value fixed | Low |
| `src/hooks/useAddDeal.ts` | toast gains `action` + `duration` | Low |
| `src/components/sections/PlanCard.tsx` | same | Low |
| `.../plan/[planId]/PlanDetailClient.tsx` | same | Low |
| `src/components/layout/Header.tsx` | cart badge prominence | Low |
| `src/components/sections/Hero.tsx` | "how it works" demoted; chips reduced; search wrapper width | Low — headline untouched |
| `src/components/forms/SearchDestination.tsx` | restyle + matching + empty state | Medium — the only substantive logic in the ticket |
| `src/components/sections/CTASection.tsx` | closing CTA target/label | Low |
| `src/app/[locale]/page.tsx` | JSON-LD contact + `sameAs` | Low |

No schema change. No migration. No new file. No new dependency.

## Rollback

Every file above is copied byte-for-byte in
`agent-workspace/backups/2026-08-10-pre-launch-tickets/`, taken from a clean tree at
`f8040bb`. `RESTORE.md` there carries the per-file and whole-tree commands. Because the ticket adds no
file and no schema change, restoring the originals is a complete rollback with nothing left behind.
