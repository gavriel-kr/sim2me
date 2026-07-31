#!/usr/bin/env node
/**
 * Ticket 028 — edge QA aid.
 *
 * A halo around cut-out hair is one or two pixels wide and invisible in a full-figure proof, so
 * this magnifies a region of a cutout and lays it over light and dark. Dark is the one that
 * matters: leftover background reads as a bright rim against it.
 *
 * Usage: node agent-workspace/scripts/zoom-edge.mjs <cutout> [--region top|head|feet] [--scale 3]
 */

import sharp from 'sharp';

const args = process.argv.slice(2);
const file = args[0];
const region = args.includes('--region') ? args[args.indexOf('--region') + 1] : 'head';
const scale = Number(args.includes('--scale') ? args[args.indexOf('--scale') + 1] : 3);

const meta = await sharp(file).metadata();
const { width: w, height: h } = meta;

const regions = {
  head: { left: 0, top: 0, width: w, height: Math.round(h * 0.2) },
  top: { left: 0, top: 0, width: w, height: Math.round(h * 0.35) },
  feet: { left: 0, top: Math.round(h * 0.82), width: w, height: Math.round(h * 0.18) },
  legs: { left: 0, top: Math.round(h * 0.5), width: w, height: Math.round(h * 0.35) },
};
const box = regions[region] ?? regions.head;

const crop = await sharp(file).extract(box).png().toBuffer();
const zoomed = await sharp(crop)
  .resize({ width: box.width * scale, kernel: 'nearest' })
  .png()
  .toBuffer();
const zm = await sharp(zoomed).metadata();

const panel = async (bg) =>
  sharp({ create: { width: zm.width, height: zm.height, channels: 4, background: bg } })
    .composite([{ input: zoomed }])
    .png()
    .toBuffer();

const out = file.replace(/\.[^.]+$/, `-zoom-${region}.png`);
await sharp({
  create: { width: zm.width, height: zm.height * 2, channels: 4, background: '#ffffff' },
})
  .composite([
    { input: await panel('#f8fafc'), left: 0, top: 0 },
    { input: await panel('#0b1220'), left: 0, top: zm.height },
  ])
  .png()
  .toFile(out);

console.log(`${out}  ${zm.width}x${zm.height * 2}  (${region} at ${scale}x)`);
