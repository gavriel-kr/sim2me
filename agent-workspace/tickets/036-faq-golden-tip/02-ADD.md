# Ticket 036 — Architectural Design (ADD)

## Where this content actually lives

| Surface | Source | Notes |
|---|---|---|
| `/help` accordion | `src/data/faq.ts` → `getFaqs()` in `src/lib/api/repositories/faqRepository.ts` → `HelpClient` | A static array behind a repository shim with a 30 ms fake delay; no database, no CMS |
| `/help` FAQ JSON-LD | a **second** hardcoded array in `src/app/[locale]/help/page.tsx:36-52` | Same fifteen pairs, different order |
| Homepage FAQ | the same `getFaqs()`, `faqs.slice(0, 5)` in `FAQSection.tsx:59` | So `faq.ts` order is homepage copy |
| Question and answer text | `faq.*` in `src/messages/{he,en,ar}.json` | `faq.ts` holds only keys |
| Troubleshooting and tips | `howItWorks.trouble1-4`, `howItWorks.tip1-5`, rendered from arrays in `how-it-works/page.tsx:60,205` | |
| Post-purchase email | `POST_PURCHASE_COPY` per locale in `src/lib/email.ts` | Shipped by 033 |

`FAQ.category` in `src/types/index.ts:54` is `category?: string`, free-form. Current values are
`general`, `devices`, `coverage`, `purchase` — which do **not** correspond to the four heading keys
that exist in the message files. Re-tagging is therefore a data change with no type change.

## The four decisions

### 1. One array, two consumers, an explicit group order

`src/data/faq.ts` stays the single source. It gains, per entry, a `group` field whose values are
exactly the four existing heading keys (`gettingStartedTitle`, `dataPlansTitle`,
`troubleshootingTitle`, `accountTitle`), and the file exports an ordered list of those groups.

- `HelpClient` renders group by group, in that order, with the heading read from `help.*`.
- `help/page.tsx` **deletes** its hardcoded array and derives the JSON-LD by iterating the same
  imported list. One source, two renderings, no possibility of drift.

`category` is left in place and untouched. It is part of the exported `FAQ` type and nothing in this
ticket needs to remove it; deleting a public field to tidy up is exactly the kind of unrelated change
that makes a diff hard to trust.

**The homepage keeps its five.** `FAQSection` slices the first five of the flat array, so grouping
alone would silently re-choose homepage copy the moment the array is reordered. The array order is
therefore preserved for the first five entries — `doYouHaveApp`, `whatIsEsim`, `howToInstall`,
`whenToActivate`, `compatibleDevices` — and grouping is applied as a rendering concern inside
`HelpClient`, which groups without depending on array order. New entries are appended, not inserted,
so the homepage set cannot move by accident.

**Rejected:** a second curated array for the homepage. It would be a third source of truth for the
same content, which is the defect this ticket exists to remove.

### 2. The contradictions resolve toward the defensible answer

| Question | Today | Resolution |
|---|---|---|
| Reinstall a deleted eSIM | FAQ promises a rescan works while the package is valid; `trouble4Desc` says a new purchase may be needed; articles say profiles are device-specific | The FAQ adopts the cautious answer: once a profile has been downloaded the activation code is generally spent, so reinstalling is **not** guaranteed and support should be contacted. `trouble4Desc` is aligned to the same wording |
| Hotspot / tethering | FAQ says "most plans"; article says "all plans" | "Most plans", plus a pointer to the plan's own detail — `Plan.tethering` is a real per-plan field and the card already renders it, so the per-plan truth is available to the customer |
| 180-day pre-activation validity | Stated as a flat catalogue-wide fact | Softened to "typically", with the plan page as the authority. **A check comes first:** if the supplier data exposes a per-plan pre-activation window, the answer points at it and the claim is dropped entirely |

The article corpus is not edited here. Where it disagrees after this pass, it is recorded as a
follow-up in the DIP rather than fixed in a ticket about the FAQ.

### 3. New entries, appended, with one of them promoted out of the FAQ

Five additions: data-only with no phone number and no SMS; what happens when the data is used up;
whether the Israeli number keeps working; carrier-locked devices; and "No Service before I fly — is
that normal?", which doubles as the FAQ home of the golden tip.

The data-only fact is too important to live only in an accordion. It also gets a line on the plan
surface, using `plan.*` keys, so it is read before the purchase rather than after the complaint. That
is a copy addition to an existing component, not a new component.

### 4. The golden tip is one copy block rendered in three places

The tip is a sequence, and a sequence rewritten by hand in three places drifts — which is precisely
how the site ended up with three versions of the no-signal advice. So the steps live once, as an
ordered list of message keys under `howItWorks.golden*`, and:

- `/how-it-works` renders them as a highlighted block at the head of the troubleshooting section
- the FAQ answer for the new "No Service" question carries the same sequence in prose
- `src/lib/email.ts` carries it inside the existing per-locale `POST_PURCHASE_COPY` table

The email is the one place that cannot import from `src/messages` — it renders outside a request and
already keeps its own copy tables per locale, established by ticket 033. So the email holds a
deliberate second copy of the wording, in the structure that file already uses, and the DIP carries an
explicit step to check the two against each other. That duplication is accepted because the
alternative is teaching `email.ts` to read `next-intl` messages, which is a far larger change to a
file that was rebuilt and shipped two weeks ago.

The three existing partial versions (`trouble1Desc`, `trouble3Desc`, `answerNoSignal`) are aligned to
the same sequence rather than left to contradict it.

**Ordering inside the tip is load-bearing**, and the sequence is: install before flying → after
landing, turn off data roaming on the physical SIM → enable the eSIM line and make it the cellular
data line → turn data roaming **on** for the eSIM → airplane mode on for about fifteen seconds, then
off, or restart → allow one to three minutes for the first attach → if still nothing, select a network
manually. The "after landing" precondition is part of the first rendered line, not a trailing caveat,
and the early-attach risk is stated.

## Files and blast radius

| File | Change | Risk |
|---|---|---|
| `src/data/faq.ts` | `group` per entry, exported group order, five appended entries | Low |
| `src/app/[locale]/help/HelpClient.tsx` | render grouped | Low |
| `src/app/[locale]/help/page.tsx` | delete the duplicate array, derive JSON-LD from the shared list | Low |
| `src/app/[locale]/how-it-works/page.tsx` | golden-tip block at the head of troubleshooting | Low |
| `src/messages/{he,en,ar}.json` | new `faq.*`, new `howItWorks.golden*`, three corrected answers, aligned troubleshooting copy | Low |
| `src/lib/email.ts` | tip inside `POST_PURCHASE_COPY` ×3 locales | **Medium** — shipped file on the money path's tail |
| plan surface (`PlanCard.tsx` or the plan detail page — decided in the DIP after reading both) | one data-only line | Low |

No schema change. No new dependency. No new route. `faqRepository.ts` and the `FAQ` type are
untouched.

## Security and correctness notes

- All copy renders as text through `next-intl` or, in the email, through the existing template
  helpers. No `dangerouslySetInnerHTML` is introduced.
- The JSON-LD change *removes* a hardcoded array and iterates a typed import; the output is still
  serialised with `JSON.stringify`, so no new injection surface.
- The email change adds static per-locale strings to an existing table. It must not touch
  `sendEmail`, the attachment path, the receipt fields or `toEmailLocale`. Ticket 033's assertion
  scripts (`email-verify.mjs`, `email-behavior.mjs`, `email-lang-check.mjs`) exist and are re-run as a
  regression gate rather than trusting inspection.

## Rollback

All seven files are in `agent-workspace/backups/2026-08-10-pre-launch-tickets/`, byte-copied from a
clean tree at `f8040bb`. No additive schema, no new file, so restoring them is a complete rollback.
