/**
 * Ticket 028 — where Simi and Sima appear, in one place.
 *
 * Components ask for a slot, never for a filename. Renaming or reshooting an asset is then a change
 * here and nowhere else, and a typo is a compile error instead of a missing image.
 *
 * Two maps: the homepage story, and the destination pages.
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

export type CharacterSlot = HomepageSlot | DestinationSlot;

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

export function resolveCharacter(slot: CharacterSlot): CharacterArt {
  return slot in HOMEPAGE
    ? HOMEPAGE[slot as HomepageSlot]
    : DESTINATION[slot as DestinationSlot];
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
