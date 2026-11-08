#!/usr/bin/env node
/**
 * Headless boot smoke — catches WebGL/TS boot failures before deploy.
 * Needs Google Chrome/Chromium on PATH (CHROME_PATH overrides).
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = 4173;
const chrome = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';

function serveStatic(req, res) {
  let url = req.url?.split('?')[0] ?? '/';
  if (url === '/') url = '/index.html';
  const file = path.join(dist, decodeURIComponent(url));
  try {
    const data = readFileSync(file);
    const ext = path.extname(file);
    const types = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.wasm': 'application/wasm',
      '.json': 'application/json',
      '.png': 'image/png',
      '.glb': 'model/gltf-binary'
    };
    res.writeHead(200, { 'Content-Type': types[ext] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
}

if (!statSync(dist).isDirectory()) {
  console.error('Run npm run build first (missing dist/)');
  process.exit(1);
}

const server = createServer(serveStatic);
await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

const errors = [];
const browser = await puppeteer.launch({
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
await page.waitForSelector('#application-canvas', { timeout: 120_000 });

await page.evaluate(() => {
  const tap = document.getElementById('tap-start');
  tap?.click();
});
await new Promise((r) => setTimeout(r, 4000));

const canvas = await page.$('#application-canvas');
const mission = await page.$eval('#mission', (el) => el.textContent?.trim() ?? '');
const crashed = errors.some((e) => /TypeError|ReferenceError|is not a function/i.test(e));

await browser.close();
server.close();

if (!canvas) {
  console.error('FAIL: no #application-canvas');
  process.exit(1);
}
if (crashed) {
  console.error('FAIL: boot errors\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`OK: canvas present, mission="${mission.slice(0, 60)}"`);
if (errors.length) console.warn('Warnings:\n' + errors.join('\n'));
