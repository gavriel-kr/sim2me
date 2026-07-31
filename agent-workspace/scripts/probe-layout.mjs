/**
 * Ticket 028 — report the exact box of named elements at a given width.
 *
 * `find-overflow.mjs` answers "is anything outside the viewport"; this answers "where exactly is this
 * thing". Written after a screenshot and an overflow scan disagreed about which side of an RTL page
 * was being clipped — the only way to settle that is to read the coordinates of the specific boxes.
 *
 * Usage: node agent-workspace/scripts/probe-layout.mjs <url> [width] [--desktop]
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2] ?? 'http://localhost:3000/he';
const width = Number(process.argv[3] ?? 375);
const mobile = !process.argv.includes('--desktop');
const port = 9334;

const profile = mkdtempSync(join(tmpdir(), 'cdp2-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  `--window-size=${width},1200`,
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targetUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('no debugging target');
}

const ws = new WebSocket(await targetUrl());
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await send('Page.enable');
await send('Runtime.enable');
if (mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 812, deviceScaleFactor: 2, mobile: true });
}
await send('Page.navigate', { url });
await sleep(9000);

const probe = `(() => {
  const vw = document.documentElement.clientWidth;
  const pick = (label, sel) => {
    const el = document.querySelector(sel);
    if (!el) return { label, missing: true };
    const r = el.getBoundingClientRect();
    return {
      label,
      left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
      inside: r.left >= -1 && r.right <= vw + 1,
    };
  };
  return JSON.stringify({
    vw,
    dir: document.documentElement.dir,
    scrollWidth: document.documentElement.scrollWidth,
    scrollLeft: document.documentElement.scrollLeft,
    rows: [
      pick('hero section', 'section.bg-gradient-hero'),
      pick('hero container', 'section.bg-gradient-hero > div.container'),
      pick('hero grid', 'section.bg-gradient-hero > div.container > div'),
      pick('text column', 'section.bg-gradient-hero > div.container > div > div:first-child'),
      pick('h1', 'section.bg-gradient-hero h1'),
      pick('subtitle p', 'section.bg-gradient-hero p'),
      pick('search wrapper', 'section.bg-gradient-hero .max-w-md'),
      pick('search input', 'section.bg-gradient-hero input'),
      pick('deal chip', 'section.bg-gradient-hero a[href="#hot-deals"]'),
      pick('visual column', 'section.bg-gradient-hero .max-w-\\\\[536px\\\\]'),
      pick('hero pair', 'section.bg-gradient-hero .character-figure'),
      pick('offer card', 'section.bg-gradient-hero [role="group"]'),
      pick('deals heading', '#hot-deals h2'),
      pick('cta heading', 'section.bg-gradient-cta h2'),
    ],
  });
})()`;

const { result } = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
const d = JSON.parse(result.value);

console.log(`\n${url}   viewport ${d.vw}px   dir=${d.dir}   scrollWidth ${d.scrollWidth}   scrollLeft ${d.scrollLeft}\n`);
for (const r of d.rows) {
  if (r.missing) { console.log(`  ${r.label.padEnd(16)} -- not found`); continue; }
  console.log(`  ${r.label.padEnd(16)} [${String(r.left).padStart(5)} .. ${String(r.right).padStart(5)}]  w=${String(r.w).padStart(4)}  ${r.inside ? 'inside' : '<< OUTSIDE >>'}`);
}

ws.close();
chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch {}
