/**
 * Ticket 028 — full-page screenshot at a real phone viewport.
 *
 * `chrome --headless --screenshot --window-size=375,...` is not a phone: without device metrics the
 * layout viewport came out 512 px wide and the PNG was simply cropped to 375, which looks exactly like
 * a page overflowing its container. That false alarm cost a diagnosis, so screenshots go through
 * `Emulation.setDeviceMetricsOverride` and `captureBeyondViewport` instead.
 *
 * Pass `--at=<selector>` to scroll that element into view and shoot the viewport around it. Needed
 * because every character below the hero is lazy-loaded: a full-page capture renders their reserved
 * boxes but never fetches the images, so the sections come out looking empty when they are fine.
 *
 * Usage: node agent-workspace/scripts/shoot-mobile.mjs <url> <out.png> [width] [portOffset] [--at=sel]
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2];
const out = process.argv[3];
const width = Number(process.argv[4] ?? 375);
const port = 9335 + (Number(process.argv[5]) || 0);

const profile = mkdtempSync(join(tmpdir(), 'cdp3-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
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
await send('Emulation.setDeviceMetricsOverride', { width, height: 812, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url });
await sleep(10000);

const at = process.argv.find((a) => a.startsWith('--at='))?.slice(5);
if (at) {
  await send('Runtime.evaluate', {
    expression: `document.querySelector(${JSON.stringify(at)})?.scrollIntoView({ block: 'center' })`,
  });
  await sleep(3000);
}

const { result } = await send('Runtime.evaluate', {
  expression: 'JSON.stringify({h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth})',
  returnByValue: true,
});
const dims = JSON.parse(result.value);

const shot = at
  ? await send('Page.captureScreenshot', { format: 'png' })
  : await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height: Math.min(dims.h, 12000), scale: 1 },
    });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log(`${out}  viewport ${dims.vw}px  scrollWidth ${dims.w}px  page height ${dims.h}px`);

ws.close();
chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch {}
