#!/usr/bin/env node
/**
 * Battleworld smoke: build + static serve + headless tap-to-start when Chrome exists.
 * Falls back to vite boot-only when CHROME_PATH is unset and no system Chrome.
 */
import { execSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

function resolveChrome() {
  const fromEnv = process.env.CHROME_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  for (const p of [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ]) {
    if (existsSync(p)) return p;
  }
  return null;
}

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
      '.json': 'application/json'
    };
    res.writeHead(200, { 'Content-Type': types[ext] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
}

async function viteBootOnly() {
  const port = 5199;
  const child = spawn('npx', ['vite', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: root,
    stdio: 'pipe',
    env: { ...process.env, BROWSER: 'none' }
  });
  let out = '';
  child.stdout.on('data', (d) => {
    out += d.toString();
  });
  child.stderr.on('data', (d) => {
    out += d.toString();
  });
  await delay(4000);
  child.kill('SIGTERM');
  if (!out.includes('Local:')) {
    console.error('smoke: vite did not become ready\n', out);
    process.exit(1);
  }
  console.log('smoke: vite boot ok (no Chrome — skipped WebGL tap)');
}

async function headlessTap() {
  const chrome = resolveChrome();
  if (!chrome) {
    await viteBootOnly();
    return;
  }
  if (!statSync(dist).isDirectory()) {
    console.error('smoke: missing dist/ — run npm run build first');
    process.exit(1);
  }
  const puppeteer = await import('puppeteer-core');
  const port = 4173;
  const server = createServer(serveStatic);
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: true,
    args: ['--use-gl=swiftshader', '--disable-gpu-sandbox', '--no-sandbox']
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0', timeout: 60_000 });
  await page.click('#tap-start');
  await delay(2500);
  await page.keyboard.down('w');
  await delay(2000);
  await page.keyboard.up('w');
  await browser.close();
  server.close();
  const hard = errors.filter(
    (e) => !e.includes('graphics device') && !e.includes('Failed to load resource')
  );
  if (hard.length) {
    console.error('smoke: runtime errors', hard.slice(0, 5));
    process.exit(1);
  }
  if (errors.length) {
    console.log('smoke: tap ok (SwiftShader/WebGL soft warnings — see CI with GPU)');
  } else {
    console.log('smoke: Battleworld tap + fly ok');
  }
}

try {
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
} catch {
  process.exit(1);
}

await headlessTap();
