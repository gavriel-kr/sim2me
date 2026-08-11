# Ticket 036 — Detailed Implementation Plan (DIP)

Status icons: ⬜ open · ✅ done · ⛔ blocked

Local only. No commit, no deploy, at any point in this plan.

## Gate — before any code

- ✅ Gabriel approves the scope in `01-PRD.md`
- ✅ **The golden tip's full wording went to Gabriel before it was inserted anywhere** (his instruction,
  2026-08-10). He read the Hebrew and approved it; English and Arabic are translations of the approved
  Hebrew, line for line
- ✅ **The reinstall answer is decided by evidence, not by preference** — see the Phase 1 finding
- ✅ Support-language and response-time claims are 026's, and 026's decision is that **neither exists**.
  This ticket introduces no claim of either kind
- ✅ No existing ticket owns this content; 026 links to `/help` but does not edit it
- ✅ Source snapshot taken — `agent-workspace/backups/2026-08-10-pre-launch-tickets/`
- ✅ Sequenced after 034 so the two do not edit the message files at the same time

## Phase 0 — Safety

- ✅ Snapshot of every file this ticket touches is in
  `agent-workspace/backups/2026-08-10-pre-launch-tickets/`
- ✅ `/he/help`, `/he/how-it-works` and `/he` render before anything changed

## Phase 1 — Research the three open questions

- ✅ **Reinstall, evidenced.** `src/lib/esimaccess.ts` exposes ordering, querying and cancelling a
  profile. There is no re-issue, re-download or replacement call, and no order in the database has ever
  been re-provisioned. The activation code is consumed by the first download, which is how eSIM
  provisioning works rather than a supplier quirk. **Finding: a deleted profile generally cannot be
  reinstalled from the same QR, on any device.** Wording follows that, and offers to ask the supplier
  rather than promising a restore
- ✅ **Pre-activation window.** Nothing in the supplier's package fields, and nothing in
  `PackageOverride`, carries a pre-activation validity figure. The blanket "180 days" was ours, not
  theirs. **Finding: the claim cannot be substantiated per plan, so it is removed.** The answer now
  says the window exists, is set per plan by the provider, and invites an email for a specific plan
- ✅ **Where the data-only line goes.** `PlanCard` is a browsing tile with no room, and the wrong place
  to explain a limitation; the plan detail page's price card is where the buy decision is made.
  **Decision: the sticky price card, directly under Add to cart.** One line, `plan.dataOnlyNote`
- ✅ Both answers recorded above before anything was edited

## Phase 2 — One source for the list

- ✅ `src/data/faq.ts` — `group` added to every entry, using the four existing `help.*` heading keys
- ✅ `FAQ_GROUPS` exported from the same file, in reading order
- ✅ `HelpClient.tsx` — renders group by group; installation and troubleshooting before the commercial
  groups. An untagged entry falls into the first section rather than disappearing
- ✅ `help/page.tsx` — the hardcoded array is gone; the JSON-LD is derived from `mockFaqs`
- ✅ JSON-LD parses in all three languages and contains all twenty questions exactly once
- ✅ **The homepage's five questions are unchanged** — asserted against the array, since `FAQSection`
  slices the first five

## Phase 3 — Resolve the contradictions

- ✅ `faq.answerReinstall` ×3 — rewritten per the Phase 1 finding
- ✅ `howItWorks.trouble4Desc` ×3 — aligned to it
- ✅ `faq.answerHotspot` ×3 — already read "most plans", with the plan's own detail as the authority;
  left as it was
- ✅ `faq.answerWhenToActivate` ×3 — per the Phase 1 finding, 180 days gone
- ✅ Article corpus grepped. Disagreements found and **logged, not fixed here** — see the follow-ups

## Phase 4 — The missing questions

Appended to the end of the array, never inserted, so the homepage set cannot shift.

- ✅ Data only — no phone number, no SMS ×3
- ✅ What happens when the data runs out ×3
- ✅ Does my own number keep working ×3
- ✅ Carrier-locked devices ×3, linking to `/compatible-devices`
- ✅ "No Service before I fly — is that normal?" ×3, carrying the golden-tip sequence
- ✅ Each tagged with its group
- ✅ `plan.dataOnlyNote` added to the plan detail price card ×3

## Phase 5 — The golden tip

- ✅ Wording approved by Gabriel before anything was edited
- ✅ `howItWorks.goldenTitle`, `goldenIntro`, `goldenStep1-5`, `goldenWarning` ×3
- ✅ The first rendered line states **after you land**; the early-attach risk is its own highlighted line
- ✅ Rendered as a highlighted block at the head of the troubleshooting section in
  `how-it-works/page.tsx`, above the `trouble1-4` grid
- ✅ `howItWorks.trouble1Desc`, `trouble3Desc` and `faq.answerNoSignal` aligned to the same sequence ×3
- ✅ `src/lib/email.ts` — the tip replaces the old one-line `tip` in `POST_PURCHASE_COPY` for he, en, ar
- ✅ Email wording diffed against the message-file wording; the five steps and the warning are identical
  text in both places
- ✅ Nothing else in `email.ts` moved: `sendEmail`, the QR attachment, the receipt rows and
  `toEmailLocale` are untouched, and the behaviour gate still passes

## Phase 6 — Verification

- ✅ `npx tsc --noEmit` → 0
- ✅ `npm run lint` → no errors, and one fewer warning than before (an unused icon import removed)
- ✅ `ReadLints` clean on every touched file
- ✅ `npx next build` → 0, 95 static pages
- ✅ Ticket 033's email gates re-run green: `email-verify.mjs`, `email-behavior.ts`, `email-lang-check.mjs`
   — no email mixes languages
- ✅ Post-purchase email rendered in he, en, ar: the tip is present in the HTML and in the text part,
  the receipt is intact, the QR is still attached
- ✅ `/help` in he, en, ar → 200, four groups, JSON-LD complete
- ✅ `/how-it-works` in he, en, ar → 200, the tip block reads as post-landing, five ordered steps
- ✅ Homepage set unchanged in all three languages
- ✅ JSON-LD parsed locally for all three languages, no empty answers, no leaked keys
- ✅ No response-time or support-hours claim anywhere on the rendered pages (that is 026's rule, and it
  is now asserted continuously by `036-content-check.mjs`)
- ✅ Proof saved — `proofs/content-check.txt`
- ✅ `CHANGELOG.md` updated under `[Unreleased]`

## Follow-ups logged, not fixed here

- **Five published article bodies were still promising support hours** — 026's rule, found here.
  Approved and fixed on 2026-08-11: the article rows with `026-article-claims-fix.mjs --fix`, and the
  two seed sources that carried the same lines. Recorded in 026's DIP rather than this one.
- **Fourteen published article bodies contradict this ticket's two retracted facts** — top-ups being
  purchasable, and 180 days of pre-activation validity. `036-article-facts-check.mjs` lists them.
  Several are general advice rather than a promise, so each wants a judgement rather than a
  find-and-replace; this is its own small ticket, not a tail of this one.
- The FAQ accordion is client-rendered on both `/help` and the homepage (`getFaqs` through
  react-query), so the questions are not in the served HTML. Google gets them via the JSON-LD, so this
  is not urgent, but rendering the list on the server would be strictly better for indexing.
- Locally the sitemap contains no destination URLs: it fetches `/api/packages` through
  `NEXTAUTH_URL`, which is http on a dev machine and gets rewritten to https, so the fetch fails and
  the catch swallows it. Harmless in production, worth confirming on the live sitemap after launch.
- Whether the FAQ should eventually move behind the CMS that already serves `getCmsPage('help')`

## Status log

- 2026-08-10: Opened after the pre-launch review.
- 2026-08-11: Implemented in full. Research findings recorded, contradictions resolved, five questions
  added, the help centre grouped, the golden tip live on `/how-it-works` and in the post-purchase
  email, and the data-only line on the plan page. All automated gates green. Awaiting Gabriel's local
  review, and his decision on the article corpus follow-up.
