/**
 * Ticket 028 — where Simi and Sima appear, in one place.
 *
 * Components ask for a slot, never for a filename. Renaming or reshooting an asset is then a change
 * here and nowhere else, and a typo is a compile error instead of a missing image.
 *
 * Homepage only for now. Destination artwork gets added as a second map when that work starts;
 * the shape below already accommodates it.
 */

export type CharacterSlot =
  | 'heroPair'
  | 'dealsReaction'
  | 'forYouLounging'
  | 'destinationsScout'
  | 'faqCurious'
  | 'ctaClose'
  | 'ctaCloseSima';

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

const HOMEPAGE: Record<CharacterSlot, CharacterArt> = {
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

export function resolveCharacter(slot: CharacterSlot): CharacterArt {
  return HOMEPAGE[slot];
}
