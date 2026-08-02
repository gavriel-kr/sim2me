# Retired: the `character-preview` route

This was `src/app/[locale]/character-preview/`, a scratch QA page from phase 1 used to eyeball every
cutout side by side on white, navy and brand green before any of them went near a real page.

Its own header said to delete it once the characters were wired into real pages. They are — 028
phase 7j put them on the destination pages, 030 on the plan page, 031 on the menu and transactional
pages — so on 2026-08-02, while preparing the release, it was moved here rather than deleted.

Two reasons it had to leave `src/`:

- It was a publicly reachable URL. `noindex` and unlinked, but reachable. It was never committed, so
  it was never live, but a single `git add -A` would have shipped it
- It was the only lint error in the character work. `react/no-unescaped-entities` on an apostrophe in
  its copy, which held the deploy gate red

Kept rather than deleted because it is the fastest way to inspect a new pose against the others. To
use it again, copy the folder back to `src/app/[locale]/character-preview/` and visit
`/he/character-preview`. Nothing else needs restoring.
