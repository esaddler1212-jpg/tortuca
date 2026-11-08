import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 5199;
const child = spawn('npx', ['vite', '--port', String(port), '--host', '127.0.0.1'], {
  cwd: new URL('..', import.meta.url).pathname,
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
const ready = out.includes('Local:') || out.includes(`localhost:${port}`);
child.kill('SIGTERM');
if (!ready) {
  console.error('smoke: vite did not become ready\n', out);
  process.exit(1);
}
console.log('smoke: vite boot ok');
