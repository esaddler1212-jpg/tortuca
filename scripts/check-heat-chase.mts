/** cn-d08 — Heat-5 cop box spawn + escape thresholds. */
import {
  HEAT_COP_BOX_ESCAPE,
  HEAT_COP_BOX_SPAWN,
  HEAT_MAX
} from '../drive-world/src/game-heat.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const chaser = fs.readFileSync(path.join(root, 'drive-world/src/heat-chaser.ts'), 'utf8');
const loop = fs.readFileSync(path.join(root, 'drive-world/src/game-loop.ts'), 'utf8');

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = true;
};

ok('heat max is 5', HEAT_MAX === 5);
ok('cop box spawns below max', HEAT_COP_BOX_SPAWN >= 4.5 && HEAT_COP_BOX_SPAWN < HEAT_MAX);
ok('escape below spawn', HEAT_COP_BOX_ESCAPE < HEAT_COP_BOX_SPAWN);
ok('chaser imports spawn constant', chaser.includes('HEAT_COP_BOX_SPAWN'));
ok('loop escape toast', loop.includes('HEAT_COP_BOX_ESCAPE') && loop.includes('Escaped'));

if (failed) process.exitCode = 1;
else console.log('check-heat-chase: ok');