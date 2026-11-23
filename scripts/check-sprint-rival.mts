#!/usr/bin/env node
import { sprintRivalGhostHud, sprintLineProgress } from '../drive-world/src/sprint-rival-ghost.ts';
import { LANDMARK_SPRINTS } from '../drive-world/src/landmark-sprints.ts';
import type { SavedProgress } from '../drive-world/src/game-progress.ts';
import { driftNitroGain } from '../drive-world/src/drift-nitro-charge.ts';

const stub = { landmarkSprintMs: {} } as SavedProgress;
const sprint = LANDMARK_SPRINTS[0]!;
const mid = sprintLineProgress(
  sprint,
  (sprint.start.x + sprint.finish.x) / 2,
  (sprint.start.z + sprint.finish.z) / 2
);
const label = sprintRivalGhostHud(stub, sprint.id, mid, 22_000, 'medium');
if (!label || (!label.includes('vs rival') && !label.includes('On rival pace'))) {
  console.error('sprint rival HUD failed');
  process.exit(1);
}
if (driftNitroGain(0.9, 40, false) <= 0) {
  console.error('drift nitro gain failed');
  process.exit(1);
}
console.log('check-sprint-rival: ok');