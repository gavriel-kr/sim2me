#!/usr/bin/env node
/**
 * Ticket 028 — throwaway diagnostic for the cutout pipeline.
 *
 * Eyeballing a downscaled proof is not decisive, so this prints a numeric occupancy map:
 * the percentage of opaque pixels in each tile of a grid. Anything opaque outside the figure
 * shows up as a non-zero tile where there should be a dot.
 *
 * Usage:
 *   node agent-workspace/scripts/probe-pixels.mjs <file> [cols] [rows]
 *   node agent-workspace/scripts/probe-pixels.mjs <file> --rect x0 y0 x1 y1 [step]
 *
 * The --rect mode samples a region against the measured border background, which is how you find
 * out whether a garment is genuinely separable from the studio grey or merely looks like it.
 */

import sharp from 'sharp';

const file = process.argv[2];
const rectIdx = process.argv.indexOf('--rect');
const cols = Number(process.argv[3] ?? 16);
const rows = Number(process.argv[4] ?? 24);

const { data, info } = await sharp(file)
  .toColourspace('srgb')
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: w, height: h, channels: ch } = info;

console.log(`${file}  ${w}x${h}  ${ch}ch`);

if (rectIdx > 0) {
  const [x0, y0, x1, y1] = process.argv.slice(rectIdx + 1, rectIdx + 5).map(Number);
  const step = Number(process.argv[rectIdx + 5] ?? 40);

  const border = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
  const chan = (k) => {
    const v = border.map((p) => data[p * ch + k]).sort((a, b) => a - b);
    return v[v.length >> 1];
  };
  const bg = [chan(0), chan(1), chan(2)];
  console.log(`background rgb(${bg.join(',')})\n`);
  console.log('     x     y   rgb                spread   dist');

  for (let y = y0; y <= y1; y += step) {
    for (let x = x0; x <= x1; x += step) {
      const i = (y * w + x) * ch;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      const dist = Math.round(
        Math.sqrt(((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2) / 3)
      );
      console.log(
        `  ${String(x).padStart(4)}  ${String(y).padStart(4)}   rgb(${String(r).padStart(3)},${String(g).padStart(3)},${String(b).padStart(3)})` +
          `      ${String(spread).padStart(3)}    ${String(dist).padStart(3)}`
      );
    }
  }
  process.exit(0);
}

console.log(`opaque coverage per tile — '.' = 0%, digit = tens of %, '#' = 100%\n`);

let totalOpaque = 0;
const lines = [];
for (let ty = 0; ty < rows; ty++) {
  const y0 = Math.floor((ty * h) / rows);
  const y1 = Math.floor(((ty + 1) * h) / rows);
  let line = '';
  for (let tx = 0; tx < cols; tx++) {
    const x0 = Math.floor((tx * w) / cols);
    const x1 = Math.floor(((tx + 1) * w) / cols);
    let opaque = 0, total = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        total++;
        if (data[(y * w + x) * ch + (ch - 1)] > 8) opaque++;
      }
    }
    totalOpaque += opaque;
    const pct = opaque / total;
    line += pct === 0 ? '.' : pct >= 0.995 ? '#' : String(Math.min(9, Math.floor(pct * 10)));
  }
  lines.push(line);
}
console.log(lines.join('\n'));
console.log(`\ntotal opaque: ${((totalOpaque / (w * h)) * 100).toFixed(1)}%`);
