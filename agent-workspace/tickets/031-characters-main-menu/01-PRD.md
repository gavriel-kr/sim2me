# Ticket 031 — Simi and Sima on every main-menu page

## Why

Six links sit in the main menu. Two of the pages behind them have Simi and Sima; four do not. A
visitor who lands on the homepage meets the pair six times on the way down, clicks "Destinations"
and meets them again beside the heading — then clicks "How it works" and the brand disappears. The
same happens on Help, Contact and the Calculator. Three of the four are exactly the pages a hesitant
buyer visits before deciding, which is the worst possible place for the site to stop sounding like
itself.

This is not a request for more illustration. It is a request for the character system to cover the
whole of the main menu, so that wherever the menu takes someone, the same two people are there.

## What the menu actually contains

Established by reading `Header.tsx`, `lib/navigation.ts` and the `/api/navigation` route, not
assumed:

| Menu entry | Route | Characters today |
|---|---|---|
| Home | `/` | **Yes** — six beats down the page, `heroPair` beside the headline |
| Destinations | `/destinations` | **Yes** — `destinationsListScouting` beside the `h1` |
| How it works | `/how-it-works` | No |
| Calculator | `/data-calculator` | No |
| Help | `/help` | No |
| Contact | `/contact` | No |

So the work is four pages, not six. Home and Destinations are already satisfied and this ticket must
prove that rather than repeat it — an extra figure on either would break the homepage's alternating
rhythm or crowd a heading that already has one.

**A finding, and now also a fix.** The menu has two different default lists. `Header.tsx` falls back
to six entries including the Calculator; `DEFAULT_NAV_MENU` in `lib/navigation.ts`, which is what the
admin screen loads, has five and omits it. Nobody has saved the navigation in admin yet, so visitors
currently get the Header's six. The first time an admin opens that screen and presses save, the
Calculator link disappears from the site — silently, and with no way to tell it was ever there.

Originally flagged for a separate decision. Gabriel asked (2026-08-02) not to be handed the choice,
so it is taken here: **the two lists are made to agree**, by adding the Calculator to
`DEFAULT_NAV_MENU`. It is a one-line change to a constant, it makes the admin screen show what the
site actually shows, and it removes a trap. This ticket is the right home for it because "characters
on every main-menu page" is only a well-defined job if the menu is one list.

## Added after the first draft, at Gabriel's request (2026-08-02)

Three pages that are **not** in the main menu but are reached from the header controls beside it, and
which a buyer passes through at the most important moment they have with the site:

| Page | Route | Reached from |
|---|---|---|
| Checkout | `/checkout` | The cart icon in the header |
| My account | `/account` | The account icon in the header |
| Order confirmation | `/success` | Automatically, after paying |

Gabriel named checkout and account, and named checkout twice. There is no `/cart` route — the cart
*is* `/checkout` — so the third slot is taken to mean the page that completes that path, the order
confirmation. Say the word if a different page was meant.

**These three use the generic poses that already exist** (`simi-generic`, `sima-generic`), as Gabriel
specified. No new artwork, no new slot art, and — on `/checkout` especially — the smallest possible
change to a page on the money path.

`/account`'s sub-pages (`login`, `register`, `forgot-password`, `reset-password`, `verify-email`) are
deliberately excluded. They are authentication screens and the safety rule on those is not worth
bending for a decoration.

## What ships

**One character placement beside the heading of each of the four bare pages**, chosen for what the
page is for:

| Page | The page's job | The pose |
|---|---|---|
| How it works | Three steps: buy, scan, connect | The pair, Simi holding a phone up mid-explanation, Sima following along |
| Calculator | Add up what your apps use and get a number | Sima alone, small notepad and pencil, glancing up mid-sum |
| Help | Lower the temperature of someone who is stuck | The pair, both offering a calm "we've got you" |
| Contact | The start of a conversation | Simi alone, waving, phone in his other hand |

Two pairs and two singles on purpose: a pair reads as a scene and suits a page that explains
something, a single figure reads as a person and suits a page that asks the visitor to do something.

## Requirements

1. **Beside the heading, not floating in the page.** The figure belongs to the `h1` it sits next to.
2. **The heading stays centred.** Three of the four headings are centred blocks. Adding a figure to
   the right of centred text un-centres it, which is worse than having no figure. The layout has to
   solve this rather than accept it.
3. **Mobile is a first-class case, not a fallback.** Every placement is specified at 375 px before it
   is specified anywhere else. Nothing may overlap the heading, push the fold down materially, or
   require a horizontal scroll.
4. **RTL and LTR both correct.** Each figure looks *inward*, toward the heading, in all three
   locales. Getting `mirror` wrong makes a character stare off the edge of the page in exactly one
   language, which is the failure mode this system already has a written rule for.
5. **The cast does not change.** Same faces, same hair, same build. Hair volume and colour are the
   recognisability anchors at this size.
6. **No new dependency, no schema change, no admin surface, no new config.**
7. **Nothing already working moves.** The homepage rhythm, the destinations heading, the destination
   pages and the plan pages are all out of scope and must be provably unchanged.

## Out of scope

- The `Header`/`DEFAULT_NAV_MENU` mismatch above — recorded, not fixed here
- Pages not in the main menu: `/account`, `/checkout`, legal pages, articles, admin
- Any change to the homepage's six beats or to the destinations index
- A shared `PageHeading` component. Four pages do not justify a refactor that touches every heading
  on the site; if a fifth and sixth page ever need one, that is the moment to extract it

## Done means

Every page reachable from the main menu shows Simi and Sima near its heading, in a pose that has
something to do with the page, correct at 375 px and at desktop width, in `he`, `en` and `ar` — and
the pages that already had them are byte-identical.
