/**
 * Ticket 033 — cut email-safe PNGs of Simi and Sima.
 *
 * Why this exists: every character asset in `public/characters` is AVIF plus WebP, and Outlook for
 * Windows renders through Word, which supports neither. Reusing them puts a broken-image icon in a
 * paying customer's inbox. PNG is the only cutout format every mail client agrees on, and the
 * figures have an alpha channel so JPEG is not an option.
 *
 * Source is the already-cut WebP in `public/characters`, not the magenta masters — the art on the
 * site and the art in the inbox should be the same pixels.
 *
 * Each figure is cropped to head-and-torso and faded out at the cut, reproducing what
 * `CharacterFigure` does with a CSS mask. The mask has to be baked into the file here because mail
 * clients do not support `mask-image`.
 *
 *   node agent-workspace/scripts/make-email-characters.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'public/characters';
const OUT = 'public/characters/email';

/** Rendered at half this in the email, so the figures stay sharp on a retina phone. */
const TARGET_H = 300;
/** Fraction of the artwork kept, measured from the top. Matches the site's `crop` prop. */
const CROP = 0.55;
/** Where the fade to transparent begins, as a fraction of the cropped height. */
const FADE_FROM = 0.78;

const POSES = [
  'pair-checking-phone-v1',
  'pair-explaining-v1',
  'pair-reassuring-v1',
  'simi-waving-v1',
];

/** RGBA buffer, opaque down to FADE_FROM then ramping to transparent. */
function fadeMask(width, height) {
  const buf = Buffer.alloc(width * height * 4);
  const start = Math.floor(height * FADE_FROM);
  for (let y = 0; y < height; y++) {
    const alpha = y < start ? 255 : Math.round(255 * (1 - (y - start) / (height - start)));
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      buf[i] = 255; buf[i + 1] = 255; buf[i + 2] = 255; buf[i + 3] = alpha;
    }
  }
  return { buf, width, height };
}

await mkdir(OUT, { recursive: true });

for (const pose of POSES) {
  const src = path.join(SRC, `${pose}.webp`);
  const meta = await sharp(src).metadata();

  const cropH = Math.floor(meta.height * CROP);
  const scale = TARGET_H / cropH;
  const outW = Math.round(meta.width * scale);
  const outH = TARGET_H;

  const cropped = await sharp(src)
    .extract({ left: 0, top: 0, width: meta.width, height: cropH })
    .resize(outW, outH, { fit: 'fill' })
    .ensureAlpha()
    .png()
    .toBuffer();

  const mask = fadeMask(outW, outH);

  const out = path.join(OUT, `${pose}.png`);
  const info = await sharp(cropped)
    .composite([{ input: mask.buf, raw: { width: mask.width, height: mask.height, channels: 4 }, blend: 'dest-in' }])
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(out);

  console.log(
    `${pose.padEnd(24)} ${meta.width}x${meta.height} -> ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`,
  );
}

console.log(`\nWrote ${POSES.length} files to ${OUT}`);
