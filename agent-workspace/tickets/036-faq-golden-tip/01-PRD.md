# Ticket 036 — Technical answers a traveler can act on (PRD)

Requested by Gabriel, 2026-08-10, during the pre-launch review. Third of four pre-launch work items.
Siblings: 034 (path to payment), 026 (honest claims and support expectations, paused and to be
re-cut), 037 (what happens after the money moves).

Checked before opening: no existing ticket owns `src/data/faq.ts`, the `/help` page structure, or the
troubleshooting copy in `howItWorks`. Ticket 026 links to `/help` from its planned auto-reply and
notes one of the contradictions below in passing, but does not edit any of this content. Tickets 028
and 031 placed characters on these pages and changed nothing else.

## The problem

**1. The same question has three different answers on the same site.** A customer who deletes their
eSIM is told by `faq.answerReinstall` that they can reinstall it by rescanning the original QR "as
long as the package is still valid", while `howItWorks.trouble4Desc` says they may have to buy a new
one, and the seeded article content says profiles are device-specific. In practice an activation code
is generally single-use once the profile has been downloaded, so the FAQ is both the most optimistic
and the most wrong — and it is the one that touches money, because the customer who believes it will
demand a free replacement.

Two more contradictions of the same kind: `faq.answerHotspot` says "most plans" support tethering
while the article content says "all Sim2Me plans" do; and `faq.answerWhenToActivate` states as a flat
fact that an eSIM is valid for 180 days before activation, across the entire catalogue, with nothing
in the data backing that per plan.

**2. The help centre is one undifferentiated pile.** `/help` renders a flat accordion of fifteen
questions. Four category headings — `help.gettingStartedTitle`, `help.dataPlansTitle`,
`help.troubleshootingTitle`, `help.accountTitle` — already exist in all three message files and are
rendered nowhere. Troubleshooting, which is what a stuck traveler is looking for, sits at positions
thirteen and fourteen of fifteen.

The page also keeps a **second, separately ordered copy of the list**: `help/page.tsx` hardcodes its
own array of fifteen key pairs for the FAQ JSON-LD. Two sources for one list, already in different
orders.

**3. The questions that generate support load are missing.** Above all: *does the eSIM give me a phone
number, can I receive SMS?* It is the most common misunderstanding in this market and it is not asked
or answered anywhere. Also absent: what happens when the data runs out, whether the Israeli number
keeps working, whether a carrier-locked phone will work (answered on the devices page but not in the
FAQ), and "I installed it at home and it says No Service — is that normal?", which is the single most
likely reason a customer contacts us before they have even flown.

**4. The activation advice that actually works is scattered and incomplete.** The airplane-mode cycle
is the standard fix for "installed but no data", and it appears nowhere. What exists instead is three
partial, differently worded versions of the surrounding advice in `howItWorks.trouble1Desc`,
`howItWorks.trouble3Desc` and `faq.answerNoSignal` — none of which mentions airplane mode at all.

## The golden tip — assessed, corrected, and why the correction matters

Gabriel proposed: install the eSIM, switch to airplane mode, restart, leave airplane mode, and the
eSIM works — with a caveat about being within coverage.

Assessment: **true in substance, and dangerous as phrased.**

- Installing before travel is correct and already advised (`howItWorks.tip1`).
- Cycling airplane mode forces the modem to detach and re-scan, and it genuinely fixes the common
  case. A toggle of roughly fifteen seconds is usually enough; a full restart mainly helps on some
  Android devices, so "restart" is safe advice but not a requirement.
- **The caveat is not a footnote, it is the whole condition.** The sequence only produces a working
  eSIM at the destination, in range of a network the profile is permitted to roam onto. Performed at
  home it does nothing — and worse, some travel profiles do hold roaming agreements in Israel, so an
  eSIM that attaches locally can start its validity window early and burn days of a plan before the
  trip begins.

So the tip ships with "after you land" as a precondition rather than a caveat, and with the full
sequence a stuck traveler needs, in order.

## What we are building

- The three contradictions are resolved to one answer each, chosen to be defensible rather than
  flattering, and made consistent with the troubleshooting copy and the article content.
- `/help` groups the questions under the four headings that already exist, with installation and
  troubleshooting first, and the JSON-LD derives from the same single source as the rendered list.
- The missing questions are added, led by "data only — no phone number and no SMS".
- The golden tip appears in three places: as a highlighted block at the head of the troubleshooting
  section on `/how-it-works`, as a FAQ entry of its own, and inside the post-purchase email, which is
  where it will actually be read — the person is landing and opening the mail that carries their QR.
- The "data only, no phone number" statement also gets a visible home outside the FAQ, on the plan
  surface, so it is seen before purchase rather than after.

## Constraints

- The homepage FAQ section renders `faqs.slice(0, 5)`, so the first five entries of the list are
  homepage copy as much as help-centre copy. Re-grouping must not quietly change what the homepage
  asks. This is a design constraint on the ADD, not a reason to avoid grouping.
- The post-purchase email was rebuilt by ticket 033, which shipped. Any addition there must fit its
  established per-locale copy tables and must not disturb the receipt or the QR attachment.
- Local only. Nothing is deployed by this ticket.

## Out of scope

- Any claim about response times or support hours — that is 026's, and this ticket must not introduce
  a new one.
- Moving the FAQ into the database or the CMS. It stays a static file; two sources of truth is the
  problem, and a third store would not fix it.
- In-form deflection on the contact page (026 non-goal, still deferred).
- Rewriting the seeded article corpus. Where an article contradicts the FAQ, the FAQ becomes correct
  and the article is logged as a follow-up.

## Acceptance

- Searching the repository for the three contradictions returns one consistent answer each.
- `/help` renders four labelled groups in all three languages, with installation and troubleshooting
  before the commercial questions, and the rendered order and the JSON-LD order come from one array.
- The homepage's five questions are unchanged unless deliberately re-chosen and recorded here.
- A visitor can find, in one place, that the product is data only with no phone number and no SMS.
- The golden tip reads as a post-landing sequence, never as something to do before flying, and states
  the risk of an early attach.
- The tip is present on `/how-it-works`, in the FAQ, and in the post-purchase email in all three
  languages, and the email's receipt, QR and attachment are unaffected.
- `tsc`, lint and `next build` clean; `/help`, `/how-it-works` and the homepage return 200 in he, en
  and ar.
