import { resolveCharacter, type CharacterSlot } from '@/lib/character-art';

/**
 * Ticket 028 — renders one brand character.
 *
 * A plain `<picture>` rather than `next/image`: the cutouts are already AVIF-with-alpha plus a WebP
 * fallback, produced by `cutout.mjs` and hand-checked on dark backgrounds. Running them through the
 * optimiser would re-encode finished art for no gain, and `next/image` cannot express the
 * AVIF-then-WebP pair for a static asset.
 *
 * The box is always sized from the artwork's intrinsic ratio, so the space is reserved before the
 * image arrives and nothing on the page moves when it does.
 *
 * Every instance is decorative — `alt=""` on purpose. The characters illustrate copy that already
 * says everything; describing them to a screen reader would add noise, not information.
 */

interface Props {
  slot: CharacterSlot;
  /** Height of the visible box, in px. */
  height: number;
  /**
   * Show only the top fraction of the artwork, faded out at the cut.
   *
   * Full-length figures shrink the face to nothing in a narrow column. Cropping to head-and-torso
   * buys back roughly double the face size at the same footprint; the fade is what keeps it from
   * looking like a photograph sliced in half.
   */
  crop?: number;
  /** Load immediately. For the hero only — it is above the fold. */
  priority?: boolean;
  className?: string;
}

export function CharacterFigure({ slot, height, crop, priority, className }: Props) {
  const art = resolveCharacter(slot);
  const aspect = art.width / art.height;
  const imageHeight = crop ? Math.round(height / crop) : height;
  const mirror = art.mirror === 'rtl' ? 'rtl:-scale-x-100' : art.mirror === 'ltr' ? 'ltr:-scale-x-100' : '';

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden ${mirror} ${className ?? ''}`}
      style={{
        width: Math.round(aspect * imageHeight),
        height,
        ...(crop
          ? {
              maskImage: 'linear-gradient(to bottom, #000 76%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 76%, transparent 100%)',
            }
          : null),
      }}
    >
      <picture>
        <source srcSet={`${art.src}.avif`} type="image/avif" />
        <img
          src={`${art.src}.webp`}
          alt=""
          width={art.width}
          height={art.height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding={priority ? 'sync' : 'async'}
          style={{ height: imageHeight, width: 'auto' }}
          className="max-w-none object-contain"
        />
      </picture>
    </div>
  );
}
