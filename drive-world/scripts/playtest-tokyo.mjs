#!/usr/bin/env node
/**
 * Tokyo bonus playtest (software WebGL): seeded "everything unlocked" save parked at the SFO gate →
 * board → cinematic → Haneda → drive → log Tokyo landmarks → reward car → reload in Tokyo → fly home.
 * Usage: npm run build && npm run test:tokyo   (PLAYTEST_SHOTS=/dir for screenshots)
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { preview } from 'vite';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogSrc = readFileSync(path.join(root, 'src/vehicle-catalog.ts'), 'utf8');
const vehicleIds = [...catalogSrc.matchAll(/^ {2}'([a-z0-9-]+)': spec\(/gm)].map((m) => m[1]);
const bayIds = vehicleIds.filter((id) => !id.startsWith('tokyo-'));

let server = null;
let url = process.env.PLAYTEST_URL;
if (!url) {
  server = await preview({ root, preview: { port: 4393, host: '127.0.0.1', strictPort: false } });
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
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--disable-renderer-backgrounding',
    '--window-size=960,540'
  ],
  defaultViewport: { width: 960, height: 540 }
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.evaluate(
  (ids) => {
    const save = {
      version: 9,
      phase: 'home',
      activeVehicleId: 'garage-cruiser',
      unlockedVehicleIds: ids,
      visitedLandmarkIds: [],
      tacoTrucksFound: ['sf', 'marin', 'eastBay', 'vallejo', 'peninsula', 'southBay'],
      unlockedRegionIds: ['sf', 'marin', 'eastBay', 'vallejo', 'peninsula', 'southBay'],
      safehouseReached: true,
      customizations: {},
      lastPose: { x: -420, y: 0.9, z: -1260, yaw: 270 },
      cameraMode: 'chase',
      missionStepsCompleted: ['pick', 'fuel', 'taco', 'landmark', 'garage']
    };
    localStorage.setItem('drive-world-progress-v5', JSON.stringify(save));
  },
  bayIds
);

const boot = async () => {
  await page.goto(`${url}?cnDebug`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForFunction(() => !!window.__cityNights, { timeout: 120_000 });
  await page.click('#tap-start').catch(() => {});
  await page.waitForFunction(() => window.__cityNights.hud().phase === 'home' && window.__cityNights.hud().playerX !== 0, {
    timeout: 60_000
  });
  await sleep(2500);
};
const hud = () =>
  page.evaluate(() => {
    const h = window.__cityNights.hud();
    return {
      x: h.playerX,
      z: h.playerZ,
      mph: h.mph,
      inTokyo: !!h.inTokyo,
      prompt: h.flightPrompt ?? null,
      cine: h.flightCinematic ?? null,
      riding: h.ridingWaymo,
      next: h.nextLandmark?.name ?? null,
      tokyoIds: h.progress?.tokyoLandmarkIds ?? [],
      flights: h.progress?.tokyoFlights ?? 0,
      reward: (h.progress?.unlockedVehicleIds ?? []).includes('tokyo-shuto-runner')
    };
  });
const carState = () =>
  page.evaluate(() => {
    const car = window.__cityNights.app.root.find((n) => n.script && n.script.vehicle)[0];
    if (!car) return null;
    const p = car.getPosition();
    return { x: p.x, y: p.y, z: p.z };
  });
const teleport = (x, z) =>
  page.evaluate(
    ([x, z]) => {
      const car = window.__cityNights.app.root.find((n) => n.script && n.script.vehicle)[0];
      car.rigidbody.teleport(x, 1.2, z);
      car.rigidbody.linearVelocity = car.rigidbody.linearVelocity.clone().set(0, 0, 0);
    },
    [x, z]
  );

await boot();
let h = await hud();
check('resume parked at SFO gate', Math.hypot(h.x + 420, h.z + 1260) < 30, `(${h.x.toFixed(0)}, ${h.z.toFixed(0)})`);
check('flight prompt ready at SFO', h.prompt?.ready === true, h.prompt?.label);
check('minimap shows Bay map', (await page.$eval('.minimap-title', (e) => e.textContent)) === 'City Nights map');
if (shot) await page.screenshot({ path: `${shot}/tokyo-01-sfo-gate.png` });

await page.keyboard.press('KeyF');
await sleep(1500);
h = await hud();
check('F boards the flight', !!h.cine && h.riding === true, h.cine?.label);
await sleep(4000);
if (shot) await page.screenshot({ path: `${shot}/tokyo-02-takeoff.png` });

await page.waitForFunction(() => !window.__cityNights.hud().flightCinematic, { timeout: 90_000 });
await sleep(3000);
h = await hud();
check('cinematic lands in Tokyo', h.inTokyo && h.x > 8000, `(${h.x.toFixed(0)}, ${h.z.toFixed(0)}) flights=${h.flights}`);
const car = await carState();
check('car spawned on Tokyo ground', !!car && car.y > -0.5 && car.y < 3, car ? `y=${car.y.toFixed(2)}` : 'no car');
check('minimap switches to Tokyo', (await page.$eval('.minimap-title', (e) => e.textContent)) === 'Tokyo · FF bonus map');
check('nav points at a Tokyo landmark', !!h.next && h.next !== 'Haneda pad — fly home', h.next);
if (shot) await page.screenshot({ path: `${shot}/tokyo-03-haneda.png` });

const d0 = await carState();
await page.keyboard.down('KeyW');
await sleep(4000);
await page.keyboard.up('KeyW');
const d1 = await carState();
const dx = d1.x - d0.x;
const dz = d1.z - d0.z;
check('drives toward the city from Haneda (NE)', dx > 0.5 && dz > 0.5, `Δ(${dx.toFixed(1)}, ${dz.toFixed(1)})`);

const marks = [
  ['tk-shibuya', 9000, 0],
  ['tk-tokyo-tower', 9240, -400 + 30],
  ['tk-shinjuku', 8600, 400],
  ['tk-ginza', 9400, 80 + 30],
  ['tk-akihabara', 9080, 540],
  ['tk-c1', 9480, -160],
  ['tk-daikoku', 8440, -240],
  ['tk-odaiba', 9720, -720]
];
for (const [id, x, z] of marks) {
  await teleport(x, z);
  await page.waitForFunction((id) => window.__cityNights.hud().progress?.tokyoLandmarkIds?.includes(id), { timeout: 30_000 }, id).catch(() => {});
  if (id === 'tk-shibuya') {
    await page.waitForFunction(() => (window.__cityNights.hud().progress?.unlockedVehicleIds ?? []).includes('tokyo-drift-monarch'), {
      timeout: 30_000
    });
    check('Shibuya unlocks Drift Monarch', true);
  }
  if (id === 'tk-shibuya' && shot) {
    await sleep(1500);
    await page.screenshot({ path: `${shot}/tokyo-04-shibuya.png` });
  }
  if (id === 'tk-tokyo-tower' && shot) {
    await sleep(1500);
    await page.screenshot({ path: `${shot}/tokyo-05-tower.png` });
  }
}
h = await hud();
check('all Tokyo landmarks logged', h.tokyoIds.length === marks.length, `${h.tokyoIds.length}/${marks.length}`);
check('Shuto Night Runner unlocked', h.reward);
const ffFleet = await page.evaluate(() =>
  (window.__cityNights.hud().progress?.unlockedVehicleIds ?? []).filter((id) => id.startsWith('tokyo-')).length
);
check('full Tokyo FF fleet unlocked', ffFleet === 8, `${ffFleet}/8`);

await teleport(8360, -640);
await sleep(3500);
await page.evaluate(() => {
  const key = 'drive-world-progress-v5';
  const raw = JSON.parse(localStorage.getItem(key) ?? '{}');
  raw.lastPose = { x: 8360, y: 0.95, z: -640, yaw: 45 };
  localStorage.setItem(key, JSON.stringify(raw));
});
await page.reload({ waitUntil: 'domcontentloaded' });
await boot();
h = await hud();
const car2 = await carState();
check('reload resumes in Tokyo', h.inTokyo && h.x > 8000, `(${h.x.toFixed(0)}, ${h.z.toFixed(0)})`);
check('car on ground after Tokyo resume', !!car2 && car2.y > -0.5 && car2.y < 3, car2 ? `y=${car2.y.toFixed(2)}` : 'no car');
check('Haneda prompt offers flight home', h.prompt?.label === 'Fly home to SFO', h.prompt?.label);

await page.keyboard.press('KeyF');
await sleep(1500);
let hReturn = await hud();
if (!hReturn.cine && hReturn.prompt?.ready) {
  await page.click('.flight-prompt.ready').catch(() => {});
  await sleep(1500);
  hReturn = await hud();
}
check('return flight starts', !!hReturn.cine);
await page.waitForSelector('.skip-waymo', { timeout: 15_000 });
await page.click('.skip-waymo');
await sleep(3000);
h = await hud();
check('Land now returns to SFO', !h.inTokyo && Math.hypot(h.x + 420, h.z + 1260) < 40, `(${h.x.toFixed(0)}, ${h.z.toFixed(0)})`);
check('minimap back to Bay', (await page.$eval('.minimap-title', (e) => e.textContent)) === 'City Nights map');
if (shot) await page.screenshot({ path: `${shot}/tokyo-06-back-at-sfo.png` });

check('no page errors', errors.length === 0, [...new Set(errors)].slice(0, 3).join(' | '));
await browser.close();
await server?.close();
process.exit(results.every(Boolean) ? 0 : 1);
