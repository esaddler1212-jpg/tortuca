#!/usr/bin/env node
/**
 * Battleworld playtest: tap → hero roster live → chapter chain HUD → fly loop.
 * Usage: npm run build && npm run test:playtest
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { preview } from 'vite';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let server = null;
let url = process.env.PLAYTEST_URL;
if (!url) {
  server = await preview({ root, preview: { port: 4396, host: '127.0.0.1', strictPort: false } });
  url = server.resolvedUrls.local[0];
}
const chrome =
  process.env.CHROME_PATH ??
  ['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(
    existsSync
  );
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail) => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

if (!chrome) {
  console.error('playtest: CHROME_PATH required');
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--window-size=960,540'
  ],
  defaultViewport: { width: 960, height: 540 }
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForSelector('#tap-start', { timeout: 30_000 });
await page.click('#tap-start');
await page.waitForFunction(() => typeof window.__battleworld?.hud === 'function', { timeout: 120_000 });
await sleep(2500);

const h0 = await page.evaluate(() => window.__battleworld.hud());
check('hero hud', !!h0?.codename?.length, h0?.codename);
check(
  'chapter chain objective',
  !!(h0?.chapterChainObjective && h0.chapterChainObjective.length > 8),
  h0?.chapterChainObjective
);
check('story chip', !!h0?.chapterChainChip, h0?.chapterChainChip);

await page.keyboard.down('KeyW');
await sleep(3500);
await page.keyboard.up('KeyW');
const h1 = await page.evaluate(() => window.__battleworld.hud());
const moved = Math.hypot((h1.heroX ?? 0) - (h0.heroX ?? 0), (h1.heroZ ?? 0) - (h0.heroZ ?? 0));
check('flight moves hero', h1.speedKmh > 80 || moved > 15, `Δ ${moved.toFixed(0)} m · ${h1.speedKmh?.toFixed?.(0) ?? h1.speedKmh} km/h`);

check('minimap mount', (await page.$('.minimap')) !== null);
check('no page errors', errors.length === 0, [...new Set(errors)].slice(0, 3).join(' | '));

await browser.close();
await server?.close();
process.exit(results.every(Boolean) ? 0 : 1);
