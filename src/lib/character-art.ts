/**
 * Ticket 028 — where Simi and Sima appear, in one place.
 *
 * Components ask for a slot, never for a filename. Renaming or reshooting an asset is then a change
 * here and nowhere else, and a typo is a compile error instead of a missing image.
 *
 * Three maps: the homepage story, the destination pages, and the rest of the site.
 */

export type HomepageSlot =
  | 'heroPair'
  | 'dealsReaction'
  | 'forYouLounging'
  | 'destinationsScout'
  | 'faqCurious'
  | 'ctaClose'
  | 'ctaCloseSima';

export type DestinationSlot =
  | 'destinationSuitcases'
  | 'destinationSeatedPhone'
  | 'destinationCheckingPhone'
  | 'destinationSelfie'
  | 'showAllSimi'
  | 'showAllSima'
  | 'catalogReaction'
  | 'destinationsListScouting'
  | 'planPriceSimi'
  | 'planPriceSima';

/**
 * Ticket 031 — the rest of the site: the pages the main menu and the header controls lead to.
 *
 * A third map rather than more entries in the two above, because both of those carry a rule this
 * group does not obey. `HOMEPAGE` is governed by the alternating-sides rhythm and the wardrobe lock;
 * `DESTINATION` is travel styling plus the slug-hash rotation. Filing these under either would put
 * art in a group whose rules do not apply to it, and the next person adding a homepage beat would
 * find slots that are not part of the sequence they are trying to preserve.
 */
export type SiteSlot =
  | 'howItWorksExplaining'
  | 'calculatorEstimating'
  | 'helpReassuring'
  | 'contactWaving'
  | 'genericSimi'
  | 'genericSima';

export type CharacterSlot = HomepageSlot | DestinationSlot | SiteSlot;

export interface CharacterArt {
  /** Path without extension. AVIF is served first, WebP is the fallback. */
  src: string;
  /** Intrinsic pixel size, so a box can be reserved before the image loads. */
  width: number;
  height: number;
  /**
   * Mirror the figure in this writing direction only.
   *
   * The rule that decides the value: a figure must look *inward*, toward the content it is
   * reacting to. Which direction that is depends on both where the figure stands and which way it
   * was drawn, so it cannot be a hardcoded class — get it wrong and the character stares off the
   * edge of the page in exactly one language.
   *
   * Worked example. Sima's reaction was drawn looking toward image-left, and she stands at the
   * inline start. In RTL the start is the right-hand side, so she already looks inward; in LTR the
   * start is the left, so she looks off the page. LTR is the one that needs flipping — the opposite
   * of the usual `rtl:` reflex.
   */
  mirror?: 'rtl' | 'ltr';
}

const HOMEPAGE: Record<HomepageSlot, CharacterArt> = {
  heroPair: { src: '/characters/pair-hero', width: 1284, height: 1008 },
  dealsReaction: { src: '/characters/sima-reacting-v1', width: 511, height: 1383, mirror: 'ltr' },
  // Seated and turned toward each other over a phone — no direction to point in, so never mirrored.
  forYouLounging: { src: '/characters/pair-lounging-v1', width: 1072, height: 929 },
  // Drawn looking image-right, stands at the inline start.
  destinationsScout: { src: '/characters/simi-scouting-v1', width: 570, height: 1350, mirror: 'rtl' },
  // Drawn looking image-right, stands at the inline end.
  faqCurious: { src: '/characters/sima-curious-v1', width: 438, height: 1430, mirror: 'ltr' },
  // Both address the camera, so the mirroring here is not about gaze — it keeps the raised thumb on
  // the outer hand. Each was drawn with the thumb on their image-left, so whichever of them stands at
  // the inline start has it pointing inward at the text, and that swaps with the writing direction.
  ctaClose: { src: '/characters/simi-closing-v1', width: 524, height: 1470, mirror: 'rtl' },
  ctaCloseSima: { src: '/characters/sima-closing-v1', width: 499, height: 1405, mirror: 'ltr' },
};

const DESTINATION: Record<DestinationSlot, CharacterArt> = {
  // The four header poses. All are the pair turned toward each other or the camera, so none of them
  // points anywhere and none is ever mirrored.
  destinationSuitcases: { src: '/characters/pair-suitcases-v1', width: 912, height: 993 },
  destinationSeatedPhone: { src: '/characters/pair-seated-phone-v1', width: 1165, height: 912 },
  destinationCheckingPhone: { src: '/characters/pair-checking-phone-v1', width: 657, height: 962 },
  destinationSelfie: { src: '/characters/pair-selfie-v1', width: 582, height: 936 },
  // Flanking the "show all plans" button, each pointing at it. Deliberately no `mirror`: they are
  // pinned to the physical left and right of the button rather than to the inline start and end, so
  // the arrangement is the same in every language and a flip would turn them away from it.
  //
  // Both point down and out, which puts their fingertips at 49% and 47% of their own height. That is
  // the whole reason the pose is drawn that way: standing the figures on the bottom of a box as tall
  // as they are lands both fingers on a vertically centred button, with no per-figure nudging.
  showAllSimi: { src: '/characters/simi-pointing-v1', width: 631, height: 1301 },
  showAllSima: { src: '/characters/sima-pointing-v1', width: 652, height: 1330 },
  // The reaction to the catalogue opening. Both look straight down, which is a gaze with no left or
  // right in it, so this one is never mirrored either.
  catalogReaction: { src: '/characters/pair-peering-down-v1', width: 881, height: 748 },
  // Heads the destinations index. Simi scans image-right through his binoculars and the pair stands
  // at the inline end, so in RTL he is already looking back over the list and only LTR needs the
  // flip — the same case as `faqCurious`.
  destinationsListScouting: { src: '/characters/pair-binoculars-v1', width: 814, height: 721, mirror: 'ltr' },
  // Beside the price on a plan's detail page. These are the plain canonical standing poses, both
  // facing the camera, so neither has a direction to be mirrored into.
  planPriceSimi: { src: '/characters/simi-generic', width: 465, height: 1392 },
  planPriceSima: { src: '/characters/sima-generic', width: 439, height: 1385 },
};

const SITE: Record<SiteSlot, CharacterArt> = {
  // Simi mid-sentence over a phone with Sima following along. The pair is turned in on itself — he
  // looks at her, she looks at the phone — so there is no outward gaze to point anywhere, and like
  // the destination header poses it is never mirrored.
  howItWorksExplaining: { src: '/characters/pair-explaining-v1', width: 580, height: 998 },
  // Sima working a number out on a notepad, eyes up toward image-right, standing at the inline end.
  // In RTL the end is the left, so she already looks back across the calculator; LTR is the flip.
  calculatorEstimating: { src: '/characters/sima-estimating-v1', width: 450, height: 1358, mirror: 'ltr' },
  // Both face image-right and Sima's open palm extends that way, at the inline end — same case.
  helpReassuring: { src: '/characters/pair-reassuring-v1', width: 709, height: 979, mirror: 'ltr' },
  // Simi waves toward image-right, at the inline end — same case again.
  contactWaving: { src: '/characters/simi-waving-v1', width: 641, height: 1377, mirror: 'ltr' },
  /*
    The plain canonical standing poses, on checkout, the account dashboard and the order
    confirmation. Both face the camera, so neither has a direction to be mirrored into.

    These resolve to the same two files as `planPriceSimi` / `planPriceSima` and are deliberately not
    the same slots. A slot names a placement, not a picture: giving checkout its own name is what
    makes it possible to re-point checkout later without touching a plan page, which is the entire
    reason components ask for slots instead of filenames.
  */
  genericSimi: { src: '/characters/simi-generic', width: 465, height: 1392 },
  genericSima: { src: '/characters/sima-generic', width: 439, height: 1385 },
};

/*
  One merged table, built once. With three maps the old nested ternary stops being readable, and a
  fourth map would make it worse; this way adding one is a single entry in the spread.
*/
const ALL_SLOTS: Record<CharacterSlot, CharacterArt> = { ...HOMEPAGE, ...DESTINATION, ...SITE };

export function resolveCharacter(slot: CharacterSlot): CharacterArt {
  return ALL_SLOTS[slot];
}

const HEADER_POSES: DestinationSlot[] = [
  'destinationSuitcases',
  'destinationSeatedPhone',
  'destinationCheckingPhone',
  'destinationSelfie',
];

/**
 * Which of the four poses greets a destination.
 *
 * Derived from the slug rather than drawn at random on each view. A per-view choice would have to be
 * made in the browser, because the server has no way to guess what the browser will pick, and the
 * header would sit empty until hydration and then jump. Hashing the slug keeps the whole thing on
 * the server, spreads the four poses across the catalogue, and shows a returning visitor the same
 * picture they saw last time.
 */
export function destinationHeaderPose(slug: string): DestinationSlot {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return HEADER_POSES[hash % HEADER_POSES.length];
}
