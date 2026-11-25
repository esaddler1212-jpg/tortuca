/** Open-world tier pack — almanac, room goal, find-next, seasons, invite, rise spawn. */
const mem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, v);
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  length: 0
};

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { almanacSummary } from '../flight-nemulator/src/battleworld-almanac.ts';
import { currentRoomGoalLocal, roomGoalHudLine } from '../flight-nemulator/src/battleworld-room-goal.ts';
import { dailyMissionFor, dailyMissionHudLine } from '../flight-nemulator/src/battleworld-seasons.ts';
import { inviteShareUrl } from '../flight-nemulator/src/battleworld-invite.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = true;
};

const goal = currentRoomGoalLocal();
ok('room goal has district', goal.districtLabel.length > 2);
ok('room goal hud', roomGoalHudLine(goal).includes('Room goal'));

const daily = dailyMissionFor('solar-apex');
ok('daily mission', dailyMissionHudLine(daily).includes('Daily'));

const alm = almanacSummary('solar-apex');
ok('almanac summary', alm.total >= 10);

const share = inviteShareUrl('test-shard', 'solar-apex', 3);
ok('invite url', share.includes('bwShard=test-shard'));

const wg = fs.readFileSync(
  path.join(root, 'flight-nemulator/src/build-city-worldgacha.ts'),
  'utf8'
);
ok('worldgacha rise', wg.includes('riseEntity'));

const hud = fs.readFileSync(path.join(root, 'flight-nemulator/src/hud/HudApp.tsx'), 'utf8');
ok('hud room goal', hud.includes('hud-room-goal'));
ok('hud find next', hud.includes('findNextLabel'));

const mm = fs.readFileSync(path.join(root, 'flight-nemulator/src/hud/Minimap.tsx'), 'utf8');
ok('minimap find next', mm.includes('minimap-find-next'));

const qt = fs.readFileSync(path.join(root, 'flight-nemulator/src/quality-tier.ts'), 'utf8');
ok('quality probe', qt.includes('tickQualityProbe'));

const handler = fs.readFileSync(
  path.join(root, 'netlify/functions/battleworld-room-goal.ts'),
  'utf8'
);
ok('room goal function', handler.includes('createBattleworldRoomGoalHandler'));

if (failed) process.exitCode = 1;
else console.log('check-battleworld-openworld-tiers: ok');