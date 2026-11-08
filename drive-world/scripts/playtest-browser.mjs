#!/usr/bin/env node
/**
 * Headless gameplay check (software WebGL): prologue skip → car pick → drive →
 * pause halts the sim → resume → 30 fps render cap keeps the sim ticking.
 * Usage: npm run build && npm run test:playtest (or set PLAYTEST_URL to a running server).
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { preview } from 'vite';

let server = null;
let url = process.env.PLAYTEST_URL;
if (!url) {
  server = await preview({ preview: { port: 4392, host: '127.0.0.1', strictPort: false } });
  url = server.resolvedUrls.local[0];
}
const chrome =
  process.env.CHROME_PATH ??
  ['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(
    existsSync
  );
const shot = process.env.PLAYTEST_SHOTS;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=960,540'],
  defaultViewport: { width: 960, height: 540 }
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${url}?cnDebug`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForFunction(() => !!window.__cityNights, { timeout: 120_000 });
await page.click('#tap-start').catch(() => {});
await sleep(1500);

const hud = () => page.evaluate(() => window.__cityNights.hud());
const state = () =>
  page.evaluate(() => ({
    ...(({ playerX, playerZ, mph, phase, simPaused }) => ({ playerX, playerZ, mph, phase, simPaused }))(
      window.__cityNights.hud()
    ),
    timeScale: window.__cityNights.app.timeScale,
    renders: window.__cityNights.renders(),
    frame: window.__cityNights.ticks()
  }));

if ((await hud()).phase === 'waymo_ride') {
  await page.click('.skip-waymo');
  await sleep(800);
}
check('prologue skipped', (await hud()).phase !== 'waymo_ride');
const card = await page.$('.picker-card');
if (card) {
  await card.click();
  await sleep(2500);
}
check('home phase after car pick', (await hud()).phase === 'home', (await hud()).phase);
check(
  '3D bay terrain present',
  await page.evaluate(
    () =>
      !!window.__cityNights.app.root.find((n) => n.name === 'bay-terrain-root') &&
      !!window.__cityNights.app.root.find((n) => n.name?.startsWith('bay-terrain-') && n.name !== 'bay-terrain-root')
  )
);

await page.evaluate(() => {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const pad = { id: 'playtest-xbox', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 };
  window.__pad = pad;
  navigator.getGamepads = () => [pad, null, null, null];
});
const press = (i, on) =>
  page.evaluate(
    ([i, on]) => {
      window.__pad.buttons[i] = { pressed: on, touched: on, value: on ? 1 : 0 };
    },
    [i, on]
  );
const tap = async (i) => {
  await press(i, true);
  await sleep(900);
  await press(i, false);
  await sleep(900);
};
const g0 = await state();
await press(7, true);
await sleep(4000);
const g1 = await state();
await press(7, false);
const gMoved = Math.hypot(g1.playerX - g0.playerX, g1.playerZ - g0.playerZ);
check('pad RT drives', g1.mph >= 3 && gMoved > 0.5, `${g0.mph.toFixed(1)} → ${g1.mph.toFixed(1)} mph, ${gMoved.toFixed(1)} m`);
await press(6, true);
await sleep(5000);
const g1b = await state();
await press(6, false);
check('pad LT brakes / reverses', g1b.mph < g1.mph || Math.hypot(g1b.playerX - g1.playerX, g1b.playerZ - g1.playerZ) > 0.5, `${g1.mph.toFixed(1)} → ${g1b.mph.toFixed(1)} mph`);
await sleep(1500);

const before = await state();
await page.keyboard.down('KeyW');
await sleep(4000);
const camChase = await page.evaluate(() => {
  const app = window.__cityNights.app;
  const car = app.root.find((n) => n.script && n.script.vehicle)[0];
  const cam = app.root.findByName('camera');
  if (!car || !cam) return { ok: false, detail: 'no car/cam' };
  const cp = car.getPosition();
  const camP = cam.getPosition();
  const relX = camP.x - cp.x;
  const relZ = camP.z - cp.z;
  const dist = Math.hypot(relX, relZ);
  const f = car.forward;
  const driveX = -f.x;
  const driveZ = -f.z;
  const dLen = Math.hypot(driveX, driveZ) || 1;
  const behindDot = (relX * driveX + relZ * driveZ) / (dist * dLen || 1);
  const behind = Math.abs(behindDot) > 0.5;
  return { ok: dist >= 2.5 && behind, dist: dist.toFixed(1), dot: behindDot.toFixed(2) };
});
const after = await state();
await page.keyboard.up('KeyW');
const moved = Math.hypot(after.playerX - before.playerX, after.playerZ - before.playerZ);
check('W drives the car', after.mph >= 3 && moved > 0.5, `${moved.toFixed(1)} m, ${after.mph} mph`);
check('chase cam behind car (dist + view dir)', camChase.ok, `dist=${camChase.dist} dot=${camChase.dot}`);
if (shot) await page.screenshot({ path: `${shot}/playtest-drive.png` });

await page.evaluate(() => window.dispatchEvent(new CustomEvent('drive-world:hud-tab', { detail: 'map' })));
await sleep(1500);
const p0 = await state();
await page.keyboard.down('KeyW');
await sleep(2000);
await page.keyboard.up('KeyW');
const p1 = await state();
const drift = Math.hypot(p1.playerX - p0.playerX, p1.playerZ - p0.playerZ);
check('Map tab pauses sim (timeScale 0)', p1.timeScale === 0 && p1.simPaused === true, `timeScale=${p1.timeScale}`);
check('car frozen while paused', drift < 0.25, `${drift.toFixed(2)} m`);
check('paused banner visible', !!(await page.$('.paused-banner')));
if (shot) await page.screenshot({ path: `${shot}/playtest-paused.png` });

await page.evaluate(() => window.dispatchEvent(new CustomEvent('drive-world:hud-tab', { detail: 'map' })));
await sleep(1500);
const r = await state();
check('second Menu press resumes', r.timeScale === 1 && !r.simPaused, `timeScale=${r.timeScale}`);

await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('drive-world-settings-v1') ?? '{}');
  window.dispatchEvent(new CustomEvent('drive-world:settings', { detail: { ...s, frameCapFps: 30 } }));
});
await sleep(1000);
const c0 = await state();
await sleep(4000);
const c1 = await state();
const ticks = c1.frame - c0.frame;
const draws = c1.renders - c0.renders;
check('30 fps cap: sim keeps ticking', ticks > 0, `${ticks} updates`);
check('30 fps cap: draws ≤ updates', draws <= ticks && draws > 0, `${draws} draws / ${ticks} updates`);

await page.evaluate(() => window.dispatchEvent(new CustomEvent('drive-world:settings', { detail: { frameCapFps: 0 } })));
await sleep(1000);
const u0 = await state();
await sleep(3000);
const u1 = await state();
check('uncapped: sim still ticks (no maxDeltaTime freeze)', u1.frame > u0.frame && u1.timeScale === 1);

await tap(9);
const g2 = await state();
check('pad Menu pauses', g2.timeScale === 0 && g2.simPaused === true);
await tap(1);
const g3 = await state();
check('pad B resumes', g3.timeScale === 1 && !g3.simPaused);
check('pad glyphs shown', (await hud()).gamepadConnected === true);
if (shot) await page.screenshot({ path: `${shot}/playtest-gamepad.png` });

check('no page errors', errors.length === 0, [...new Set(errors)].slice(0, 3).join(' | '));

await browser.close();
await server?.close();
process.exit(results.every((x) => x.ok) ? 0 : 1);
