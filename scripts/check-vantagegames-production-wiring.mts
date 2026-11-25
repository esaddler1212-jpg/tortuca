/**
 * Production wiring for Battleworld cloud (Tortuca deploy) — static audit.
 * Live POST smoke still needs a signed Netlify preview after deploy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_API_HANDLERS } from '../shared/thinProgrammingPolicy.ts';
import { createBattleworldRoomGoalHandler } from '../shared/battleworld-room-goal-handler.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = true;
};

ok('room goal Netlify function', fs.existsSync(path.join(root, 'netlify/functions/battleworld-room-goal.ts')));
ok('lattice Netlify function', fs.existsSync(path.join(root, 'netlify/functions/flight-nemulator-lattice.ts')));
ok('shared room-goal handler', typeof createBattleworldRoomGoalHandler === 'function');

const toml = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
ok('lattice session gate in netlify.toml', toml.includes('BATTLEWORLD_LATTICE_REQUIRE_SESSION'));

const publicRoutes = new Set(PUBLIC_API_HANDLERS);
ok('thin policy: battleworld-room-goal public', publicRoutes.has('battleworld-room-goal'));

const authClient = fs.readFileSync(path.join(root, 'flight-nemulator/src/tortuca-auth.ts'), 'utf8');
ok('lattice client session header', authClient.includes('X-Alfred-Session'));

const hub = fs.readFileSync(path.join(root, 'games-hub/scripts/build-all.mjs'), 'utf8');
ok('games-hub builds flight-nemulator', hub.includes('flight-nemulator'));

const deployDoc = fs.readFileSync(path.join(root, 'docs/BROWSER_VISUAL_DEPLOY.md'), 'utf8');
ok('deploy doc mentions visual packs', deployDoc.includes('netlify-visual-assets'));

if (failed) process.exitCode = 1;
else console.log('check-vantagegames-production-wiring: ok');