#!/usr/bin/env node
/**
 * Ticket 028 — how dark can the globe get before the hero text stops being readable?
 *
 * Worst case is a headline character sitting directly on top of an engraved line, where the mask
 * is fully opaque, so that is what this computes: ink composited over each gradient stop at full
 * mask alpha, then the WCAG contrast of the text on that.
 *
 * The headline is 60 px extrabold and counts as large text (AA needs 3.0). The subtitle is 20 px
 * regular in a muted grey and counts as normal text (AA needs 4.5) — it is the one that fails
 * first, not the headline, which is why guessing an opacity by looking at the headline is wrong.
 */

const HERO_STOPS = [
  ['gradient start', [160, 0.84, 0.97]],
  ['gradient mid', [200, 0.6, 0.97]],
  ['gradient end', [160, 0.4, 0.98]],
];

const INK = [160, 0.84, 0.25];

const TEXT = [
  { label: 'headline (60px bold)', hsl: [220, 0.25, 0.1], min: 3.0 },
  { label: 'subtitle (20px)', hsl: [220, 0.1, 0.46], min: 4.5 },
  { label: 'chip label (14px)', hsl: [220, 0.25, 0.1], min: 4.5 },
];

const OPACITIES = [0, 0.06, 0.1, 0.14, 0.18, 0.22, 0.3];

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m].map((v) => v * 255);
}

const relativeLuminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const over = (fg, bg, alpha) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));

const inkRgb = hslToRgb(...INK);
console.log('Worst-case contrast: text on a fully opaque globe line\n');
console.log(`${'opacity'.padEnd(9)}${TEXT.map((t) => t.label.padEnd(24)).join('')}`);

for (const opacity of OPACITIES) {
  const cells = TEXT.map((t) => {
    const textRgb = hslToRgb(...t.hsl);
    const worst = Math.min(
      ...HERO_STOPS.map(([, hsl]) => contrast(textRgb, over(inkRgb, hslToRgb(...hsl), opacity)))
    );
    const verdict = worst >= t.min ? 'pass' : 'FAIL';
    return `${worst.toFixed(1)}:1 ${verdict}`.padEnd(24);
  });
  console.log(`${String(opacity).padEnd(9)}${cells.join('')}`);
}

console.log('\nThresholds: ' + TEXT.map((t) => `${t.label} ${t.min}:1`).join(', '));
