#!/usr/bin/env node
/**
 * Ticket 028 — turn black-on-white line art into a CSS mask.
 *
 * `mask-image` reads the alpha channel, so the artwork has to carry its shape in alpha rather than
 * in colour. Inverting luminance into alpha does that, and it is what makes the globe palette
 * independent: the file supplies the shape, CSS supplies the colour, and a future palette change
 * needs no new asset.
 *
 * Usage:
 *   node agent-workspace/scripts/lineart-to-mask.mjs <input> --out <path-without-extension>
 *
 *   --gamma <n>   >1 thins and lightens the lines, <1 thickens them (default: 1)
 *   --size <n>    longest edge in px (default: 1200)
 *   --floor <n>   alpha below this becomes 0, killing JPEG-ish haze in the white (default: 12)
 */

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out');
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const out = opt('out', path.join('public/brand', path.basename(input).replace(/\.[^.]+$/, '')));
const gamma = Number(opt('gamma', 1));
const size = Number(opt('size', 1200));
const floor = Number(opt('floor', 12));

const { data, info } = await sharp(input)
  .resize({ width: size, height: size, fit: 'inside' })
  .toColourspace('b-w')
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: w, height: h, channels } = info;
const n = w * h;
const rgba = Buffer.alloc(n * 4);
let ink = 0;

for (let p = 0; p < n; p++) {
  const lum = data[p * channels];
  let alpha = 255 - lum;
  if (gamma !== 1) alpha = 255 * Math.pow(alpha / 255, gamma);
  if (alpha < floor) alpha = 0;

  const d = p * 4;
  rgba[d] = 255;
  rgba[d + 1] = 255;
  rgba[d + 2] = 255;
  rgba[d + 3] = alpha;
  if (alpha > 0) ink++;
}

await fs.mkdir(path.dirname(out), { recursive: true });
const png = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
const written = [];
for (const [ext, pipe] of [
  ['webp', sharp(png).webp({ quality: 90, alphaQuality: 95 })],
  ['png', sharp(png).png({ compressionLevel: 9, palette: true })],
]) {
  const { size: bytes } = await pipe.toFile(`${out}.${ext}`);
  written.push(`${path.basename(out)}.${ext} ${(bytes / 1024).toFixed(0)} KB`);
}

console.log(`  ${w}x${h}, gamma ${gamma}, ink coverage ${((ink / n) * 100).toFixed(1)}%`);
console.log(`  written  ${written.join('  |  ')}`);
