#!/usr/bin/env node
/** One-command Vice '86 polish round: prompt + City Nights regression hints. */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const steps = ['vice86-6', 'vice86-7'] as const;

console.log('# Vice ’86 polish round (engineering gate)\n');
for (const step of steps) {
  const r = spawnSync('npm', ['run', 'game:polish-prompt', '--', 'city-nights', step], {
    cwd: root,
    encoding: 'utf8'
  });
  process.stdout.write(r.stdout);
}

console.log('\n## Run before screenshot upload\n');
console.log('- npm run test:visual-tiers');
console.log('- cd drive-world && npm run test:playtest');
console.log('- Settings → Vice ’86 density ON → reload → nitro dusk freeway frame');