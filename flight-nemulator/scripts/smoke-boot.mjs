#!/usr/bin/env node
/**
 * Headless boot smoke — serves dist/, taps start, flies briefly, fails on runtime errors.
 * Resolves Chromium on Linux CI (CHROME_PATH overrides).
 */
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = 4183;

function resolveChromePath() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/usr/local/bin/google-chrome'
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  try {
    const found = execSync('which chromium chromium-browser google-chrome 2>/dev/null | head -1', {
      encoding: 'utf8'
    }).trim();
    if (found && existsSync(found)) return found;
  } catch {
    /* */
  }
  return process.env.CHROME_PATH || '/usr/bin/chromium';
}

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary'
};

function serveStatic(req, res) {
  let url = req.url?.split('?')[0] ?? '/';
  if (url === '/') url = '/index.html';
  const file = path.join(dist, decodeURIComponent(url));
  try {
    const data = readFileSync(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
}

if (!existsSync(dist) || !statSync(dist).isDirectory()) {
  console.error('Run npm run build first (missing dist/)');
  process.exit(1);
}

const chrome = resolveChromePath();
if (!existsSync(chrome)) {
  console.error(`FAIL: no Chromium/Chrome at ${chrome} — set CHROME_PATH or install chromium`);
  process.exit(1);
}

const server = createServer(serveStatic);
await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

const errors = [];
let browser;
let exitCode = 0;
try {
  browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('#application-canvas', { timeout: 60_000 });
  await page.click('#tap-start').catch(() => {});
  await new Promise((r) => setTimeout(r, 4000));
  await page.keyboard.down('w');
  await new Promise((r) => setTimeout(r, 3000));
  await page.keyboard.up('w');
  await new Promise((r) => setTimeout(r, 500));

  const hudText = await page.$eval('#react-hud', (el) => el.textContent?.trim() ?? '').catch(() => '');
  const crashed = errors.some((e) => /TypeError|ReferenceError|is not a function/i.test(e));
  if (crashed) {
    console.error('FAIL: boot errors\n' + errors.join('\n'));
    exitCode = 1;
  } else {
    console.log(`OK: canvas present, hud="${hudText.slice(0, 60)}"`);
    if (errors.length) console.warn('Warnings:\n' + errors.join('\n'));
  }
} catch (err) {
  console.error('FAIL:', err instanceof Error ? err.message : err);
  exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
  server.close();
}
process.exit(exitCode);
