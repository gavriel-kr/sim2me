#!/usr/bin/env node
/**
 * Ticket 028 — character cutout pipeline.
 *
 * Turns a character rendered on a flat studio background into an alpha cutout.
 *
 * Uses a border flood fill rather than a global colour key: white clothing and pale skin share
 * the background's colour range, so a global key eats them. Flood fill only removes the region
 * connected to the image border, so interior whites survive.
 *
 * On a magenta render, use --key: nothing anyone wears is near magenta, so every matching pixel is
 * background whether or not it connects to the border. This is the mode to use. It is what handles
 * the gap between someone's legs, the gap under an arm and the gaps between fingers, all of which
 * are enclosed and which the flood fill therefore cannot reach.
 *
 * The flood-fill path below exists for the legacy grey renders and should not be used for new
 * work. There, a pixel counts as background only if it is both close to the measured background
 * colour and neutral grey, and both conditions are needed: the studio grey sits right on top of
 * light denim, so a distance-only test walks in from the hem and eats Sima's jeans. Even then it
 * is imperfect, because parts of that denim measure identical to the background — which is the
 * whole reason the recipe moved to magenta.
 *
 * Usage:
 *   node agent-workspace/scripts/cutout.mjs <input> [options]
 *
 *   --out <path>     output basename, no extension   (default: public/characters/<input name>)
 *   --tol <n>        distance from the measured background (default: 14)
 *   --grey <n>       max channel spread for a background pixel; 0 = off (default: 8)
 *   --key            global colour key: drop every matching pixel, connected or not (magenta)
 *   --despill <0-1>  strength of magenta spill removal, applied with --key (default: 1)
 *   --holes <n>      with flood fill only: clear enclosed pockets up to n px (default: 3000)
 *   --hole-tol <n>   how exactly a pocket must match the background (default: 6)
 *   --erode <n>      pixels to shave off the edge     (default: 1)
 *   --feather <n>    blur sigma on the alpha edge     (default: 0.7)
 *   --pad <n>        transparent padding after trim   (default: 8)
 *   --no-trim        keep the original canvas
 *   --proof          also write <out>-proof.png: the cutout on light, dark and brand green
 *   --debug          also write <out>-mask.png: the raw keep/remove mask
 *   --dry            report only, write nothing
 */

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';

const DEFAULTS = {
  tol: 14, grey: 8, key: false, despill: 1,
  holes: 3000, holeTol: 6, erode: 1, feather: 0.7, pad: 8,
};

function parseArgs(argv) {
  const opts = { ...DEFAULTS, trim: true, proof: false, debug: false, dry: false, input: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-trim') opts.trim = false;
    else if (a === '--proof') opts.proof = true;
    else if (a === '--debug') opts.debug = true;
    else if (a === '--key') opts.key = true;
    else if (a === '--despill') opts.despill = Number(argv[++i]);
    else if (a === '--dry') opts.dry = true;
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--tol') opts.tol = Number(argv[++i]);
    else if (a === '--grey') opts.grey = Number(argv[++i]);
    else if (a === '--holes') opts.holes = Number(argv[++i]);
    else if (a === '--hole-tol') opts.holeTol = Number(argv[++i]);
    else if (a === '--erode') opts.erode = Number(argv[++i]);
    else if (a === '--feather') opts.feather = Number(argv[++i]);
    else if (a === '--pad') opts.pad = Number(argv[++i]);
    else if (!a.startsWith('--')) opts.input = a;
    else throw new Error(`Unknown option: ${a}`);
  }
  if (!opts.input) throw new Error('Missing input file.');
  if (!opts.out) {
    opts.out = path.join('public/characters', path.basename(opts.input).replace(/\.[^.]+$/, ''));
  }
  return opts;
}

/** Median colour of the 1px border ring — robust to a figure that touches an edge. */
function estimateBackground(data, w, h, ch) {
  const rs = [], gs = [], bs = [];
  const sample = (x, y) => {
    const i = (y * w + x) * ch;
    rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]);
  };
  for (let x = 0; x < w; x++) { sample(x, 0); sample(x, h - 1); }
  for (let y = 0; y < h; y++) { sample(0, y); sample(w - 1, y); }
  const mid = (arr) => arr.sort((a, b) => a - b)[arr.length >> 1];
  return [mid(rs), mid(gs), mid(bs)];
}

function makeBackgroundTest(data, ch, bg, { tol, grey }) {
  const tolSq = tol * tol * 3;

  return (p) => {
    const i = p * ch;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dr = r - bg[0], dg = g - bg[1], db = b - bg[2];
    if (dr * dr + dg * dg + db * db > tolSq) return false;
    if (grey <= 0) return true;
    return Math.max(r, g, b) - Math.min(r, g, b) <= grey;
  };
}

/** Mask: 255 = keep (figure), 0 = removed (background connected to the border). */
function floodFillBackground(w, h, isBackground) {
  const n = w * h;
  const mask = new Uint8Array(n).fill(255);
  const stack = new Int32Array(n);
  let sp = 0;

  const push = (p) => {
    if (mask[p] === 0 || !isBackground(p)) return;
    mask[p] = 0;
    stack[sp++] = p;
  };

  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }

  while (sp > 0) {
    const p = stack[--sp];
    const x = p % w, y = (p / w) | 0;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }
  return mask;
}

/**
 * Clear background pockets the border fill could not reach — the gaps between curls, which are
 * genuine background but fully enclosed by hair. Left alone they glow against a dark page.
 *
 * Two guards keep it from eating the figure. Size is capped, so large interior areas that merely
 * sit near the background's colour — Sima's light jeans — are never touched. And the colour match
 * is far tighter than the border fill's: a curl gap is literally the background, exact to a point
 * or two, while a shadow fold in white linen is a rendered grey that drifts further off. Without
 * the tighter match this pass punches speckles into the shirt.
 */
function clearEnclosedPockets(mask, w, h, isBackground, maxArea) {
  const n = w * h;
  const seen = new Uint8Array(n);
  const queue = new Int32Array(n);
  const component = new Int32Array(n);
  let cleared = 0, pockets = 0;

  for (let start = 0; start < n; start++) {
    if (seen[start] || mask[start] === 0 || !isBackground(start)) continue;

    let qh = 0, qt = 0, size = 0;
    queue[qt++] = start;
    seen[start] = 1;
    while (qh < qt) {
      const p = queue[qh++];
      component[size++] = p;
      const x = p % w, y = (p / w) | 0;
      const neighbours = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of neighbours) {
        if (q < 0 || seen[q] || mask[q] === 0 || !isBackground(q)) continue;
        seen[q] = 1;
        queue[qt++] = q;
      }
    }

    if (size <= maxArea) {
      for (let k = 0; k < size; k++) mask[component[k]] = 0;
      cleared += size;
      pockets++;
    }
  }
  return { cleared, pockets };
}

/** Shave the outermost keep-pixels: that ring carries the background's colour bleed. */
function erode(mask, w, h, iterations) {
  let src = mask;
  for (let it = 0; it < iterations; it++) {
    const dst = Uint8Array.from(src);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (src[p] === 0) continue;
        const edge =
          (x === 0 || src[p - 1] === 0) ||
          (x === w - 1 || src[p + 1] === 0) ||
          (y === 0 || src[p - w] === 0) ||
          (y === h - 1 || src[p + w] === 0);
        if (edge) dst[p] = 0;
      }
    }
    src = dst;
  }
  return src;
}

function alphaBBox(alpha, w, h, threshold = 8) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const src = sharp(opts.input).ensureAlpha();
  const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;

  const bg = estimateBackground(data, w, h, ch);
  const isBackground = makeBackgroundTest(data, ch, bg, opts);

  let mask;
  if (opts.key) {
    mask = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) mask[p] = isBackground(p) ? 0 : 255;
  } else {
    mask = floodFillBackground(w, h, isBackground);
  }

  const removed = mask.reduce((acc, v) => acc + (v === 0 ? 1 : 0), 0);
  const removedPct = ((removed / (w * h)) * 100).toFixed(1);
  console.log(`  source      ${w}x${h}, ${ch}ch`);
  console.log(
    `  background  rgb(${bg.join(', ')})  ${opts.key ? 'colour key' : 'flood fill'}, tol ${opts.tol}` +
      (opts.key ? '' : ` / grey ${opts.grey}`)
  );
  console.log(`  removed     ${removedPct}% of pixels`);

  if (removed < w * h * 0.05) {
    console.warn('  WARNING: almost nothing was removed — the background is probably not flat.');
  }
  if (removed > w * h * 0.97) {
    console.warn('  WARNING: nearly everything was removed — tolerance is too high.');
  }

  if (opts.holes > 0 && !opts.key) {
    const isPocket = makeBackgroundTest(data, ch, bg, { tol: opts.holeTol, grey: opts.grey });
    const { cleared, pockets } = clearEnclosedPockets(mask, w, h, isPocket, opts.holes);
    console.log(
      `  pockets     ${pockets} enclosed, ${cleared} px cleared (cap ${opts.holes} px, tol ${opts.holeTol})`
    );
  }

  if (opts.debug && !opts.dry) {
    await fs.mkdir(path.dirname(opts.out), { recursive: true });
    await sharp(Buffer.from(mask), { raw: { width: w, height: h, channels: 1 } })
      .png()
      .toFile(`${opts.out}-mask.png`);
    console.log(`  mask        ${opts.out}-mask.png`);
  }

  if (opts.erode > 0) mask = erode(mask, w, h, opts.erode);

  let alpha = mask;
  if (opts.feather > 0) {
    // sharp promotes a 1-channel raw buffer to sRGB unless the colourspace is pinned, which
    // silently returns three interleaved channels and misaligns every alpha lookup.
    const blurred = await sharp(Buffer.from(mask), { raw: { width: w, height: h, channels: 1 } })
      .blur(Math.max(0.3, opts.feather))
      .toColourspace('b-w')
      .raw()
      .toBuffer({ resolveWithObject: true });

    const stride = blurred.data.length / (w * h);
    if (!Number.isInteger(stride)) {
      throw new Error(`Unexpected blur output: ${blurred.data.length} bytes for ${w}x${h}`);
    }
    alpha = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) alpha[p] = blurred.data[p * stride];
  }

  // Magenta bleeds into anything fine and translucent — curly hair especially — leaving purple
  // tips that survive the key because they are no longer magenta enough to remove. Magenta is high
  // red and blue with low green, so the excess of the weaker of red/blue over green measures the
  // spill and can be subtracted. Skin and blonde hair have blue below green, so they score zero
  // and are untouched; the earth-tones-only wardrobe rule means nothing worn is legitimately
  // purple either.
  const despill = opts.key ? opts.despill : 0;
  let spilled = 0;

  const rgba = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    const s = p * ch, d = p * 4;
    let r = data[s], g = data[s + 1], b = data[s + 2];

    if (despill > 0 && alpha[p] > 0) {
      const excess = Math.min(r, b) - g;
      if (excess > 0) {
        r -= excess * despill;
        b -= excess * despill;
        spilled++;
      }
    }

    rgba[d] = r;
    rgba[d + 1] = g;
    rgba[d + 2] = b;
    rgba[d + 3] = alpha[p];
  }
  if (despill > 0) {
    console.log(`  despill     ${spilled} px corrected at strength ${despill}`);
  }

  let out = sharp(rgba, { raw: { width: w, height: h, channels: 4 } });
  let outW = w, outH = h;

  if (opts.trim) {
    const box = alphaBBox(alpha, w, h);
    if (!box) throw new Error('Everything was removed — nothing left to write.');
    const pad = opts.pad;
    const left = Math.max(0, box.minX - pad);
    const top = Math.max(0, box.minY - pad);
    outW = Math.min(w - left, box.maxX - box.minX + 1 + pad * 2);
    outH = Math.min(h - top, box.maxY - box.minY + 1 + pad * 2);
    out = out.extract({ left, top, width: outW, height: outH });
    console.log(`  trimmed     ${w}x${h} -> ${outW}x${outH}`);
  }

  if (opts.dry) {
    console.log('  dry run — nothing written');
    return;
  }

  await fs.mkdir(path.dirname(opts.out), { recursive: true });
  const trimmed = await out.png().toBuffer();

  const written = [];
  for (const [ext, pipe] of [
    ['avif', sharp(trimmed).avif({ quality: 62, effort: 6 })],
    ['webp', sharp(trimmed).webp({ quality: 88, alphaQuality: 90 })],
  ]) {
    const file = `${opts.out}.${ext}`;
    const { size } = await pipe.toFile(file);
    written.push(`${path.basename(file)} ${(size / 1024).toFixed(0)} KB`);
  }
  console.log(`  written     ${written.join('  |  ')}`);

  if (opts.proof) {
    const proofH = 900;
    const scaled = await sharp(trimmed).resize({ height: proofH }).png().toBuffer();
    const sw = (await sharp(scaled).metadata()).width;
    const panel = async (bgColour) =>
      sharp({ create: { width: sw + 40, height: proofH + 40, channels: 4, background: bgColour } })
        .composite([{ input: scaled, left: 20, top: 20 }])
        .png()
        .toBuffer();

    const light = await panel('#f8fafc');
    const dark = await panel('#0b1220');
    const mid = await panel('#10b981');
    const file = `${opts.out}-proof.png`;
    await sharp({
      create: { width: (sw + 40) * 3, height: proofH + 40, channels: 4, background: '#ffffff' },
    })
      .composite([
        { input: light, left: 0, top: 0 },
        { input: dark, left: sw + 40, top: 0 },
        { input: mid, left: (sw + 40) * 2, top: 0 },
      ])
      .png()
      .toFile(file);
    console.log(`  proof       ${file}`);
  }
}

main().catch((err) => {
  console.error(`cutout failed: ${err.message}`);
  process.exit(1);
});
