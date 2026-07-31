/**
 * Ticket 028 — find what makes a page wider than a phone screen.
 *
 * Horizontal overflow is close to impossible to diagnose by eye: every element on the page looks
 * shifted, and the one that actually causes it is usually off-screen. This drives an already-installed
 * Chrome over the DevTools Protocol — no new dependency, Node's global WebSocket does the talking —
 * loads the page at a phone width, and reports every element whose box crosses the viewport edge,
 * innermost first. The innermost offender is the cause; everything above it in the list is its
 * ancestors being dragged along.
 *
 * Usage: node agent-workspace/scripts/find-overflow.mjs <url> [width]
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2] ?? 'http://localhost:3000/he';
const width = Number(process.argv[3] ?? 375);
const port = 9333;

const profile = mkdtempSync(join(tmpdir(), 'cdp-'));
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
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome did not expose a debugging target');
}

const ws = new WebSocket(await targetUrl());
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
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
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height: 812,
  deviceScaleFactor: 2,
  mobile: true,
});
await send('Page.navigate', { url });
await sleep(9000);

const probe = `(() => {
  const vw = document.documentElement.clientWidth;
  const doc = document.documentElement;
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.position === 'fixed') continue;
    const over = Math.max(0, Math.round(-r.left), Math.round(r.right - vw));
    if (over > 1) {
      out.push({
        over,
        w: Math.round(r.width),
        left: Math.round(r.left),
        right: Math.round(r.right),
        depth: (function d(n){let c=0;while(n.parentElement){c++;n=n.parentElement}return c})(el),
        tag: el.tagName.toLowerCase(),
        cls: (el.getAttribute('class') || '').slice(0, 110),
        text: (el.textContent || '').trim().replace(/\\s+/g,' ').slice(0, 45),
      });
    }
  }
  out.sort((a, b) => b.depth - a.depth);
  return JSON.stringify({
    viewport: vw,
    scrollWidth: doc.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    count: out.length,
    worst: out.slice(0, 25),
  });
})()`;

const { result } = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
const data = JSON.parse(result.value);

console.log(`\nurl        ${url}`);
console.log(`viewport   ${data.viewport}px`);
console.log(`scrollWidth ${data.scrollWidth}px  (body ${data.bodyScrollWidth}px)`);
console.log(`overflowing elements: ${data.count}\n`);
for (const e of data.worst) {
  console.log(`  +${String(e.over).padStart(4)}px  w=${String(e.w).padStart(4)}  [${e.left}..${e.right}]  <${e.tag}> ${e.cls}`);
  if (e.text) console.log(`            "${e.text}"`);
}

ws.close();
chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch {}
