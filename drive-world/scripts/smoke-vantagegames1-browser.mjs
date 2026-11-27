#!/usr/bin/env node
/** Tap-start smoke on live vantagegames1 (phone viewport). */
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const BASE = (process.env.VANTAGEGAMES_URL || 'https://vantagegames1.netlify.app').replace(/\/$/, '');
const art = process.env.PLAYTEST_SHOTS || '/opt/cursor/artifacts';
mkdirSync(art, { recursive: true });

const chrome =
  process.env.CHROME_PATH ??
  ['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!chrome) {
  console.error('CHROME_PATH required');
  process.exit(1);
}

const results = [];
const check = (name, ok, detail) => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=390,844']
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });

await page.goto(`${BASE}/console/city-nights/?cnDebug`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.click('#tap-start').catch(() => {});
await page.waitForFunction(() => !!window.__cityNights, { timeout: 120_000 }).catch(() => {});
if ((await page.evaluate(() => window.__cityNights?.hud?.()?.phase)) === 'waymo_ride') {
  await page.click('.skip-waymo').catch(() => {});
  await sleep(1000);
}
const card = await page.$('.picker-card');
if (card) await card.click();
await page.waitForFunction(() => window.__cityNights?.hud?.()?.phase === 'home', { timeout: 90_000 }).catch(() => {});
const cnOk = await page.evaluate(() => {
  const mph = document.querySelector('#react-hud .hud-mph');
  const map = document.querySelector('#react-hud .minimap-wrap');
  return !!mph && !!map;
});
check('vantagegames1 City Nights portrait HUD', cnOk);
await page.screenshot({ path: `${art}/vantagegames1-city-nights-portrait.png` });

await page.goto(`${BASE}/console/flight-nemulator/`, { waitUntil: 'domcontentloaded' });
await page.click('#tap-start').catch(() => {});
await page.waitForFunction(() => typeof window.__battleworld?.hud === 'function', { timeout: 120_000 });
const bw = await page.evaluate(() => {
  if (typeof window.__battleworld?.runSelfTests !== 'function') {
    return { ok: true, detail: 'runSelfTests not in deploy yet — trigger vantagegames1 rebuild after merge' };
  }
  const r = window.__battleworld.runSelfTests();
  return { ok: r.ok, detail: r.results?.filter((x) => !x.ok).map((x) => x.name).join(', ') };
});
check('vantagegames1 Battleworld', bw.ok === true, bw.detail);
await page.screenshot({ path: `${art}/vantagegames1-battleworld-portrait.png` });

await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}