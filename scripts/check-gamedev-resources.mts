import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [
  'gamedev-resources/tortuca-playcanvas.json',
  'gamedev-resources/tortuca-public-apis.json',
  'gamedev-resources/tortuca-game-engines.json',
  'gamedev-resources/upstream-pin.json',
  'tools/gamedev-resources/install-free-packs.sh',
  'docs/BLOCKBENCH_WORKFLOW.md'
];

for (const rel of files) {
  const f = path.join(root, rel);
  if (!existsSync(f)) {
    console.error(`gamedev-resources missing ${f}`);
    process.exit(1);
  }
}

const play = JSON.parse(readFileSync(path.join(root, 'gamedev-resources/tortuca-playcanvas.json'), 'utf8')) as {
  entries: unknown[];
};
const apis = JSON.parse(readFileSync(path.join(root, 'gamedev-resources/tortuca-public-apis.json'), 'utf8')) as {
  entries: unknown[];
};
if (!play.entries?.length || !apis.entries?.length) {
  console.error('catalog missing entries');
  process.exit(1);
}

const pin = JSON.parse(readFileSync(path.join(root, 'gamedev-resources/upstream-pin.json'), 'utf8')) as {
  kavexGameDevResources?: { commit?: string };
};
console.log(
  `check-gamedev-resources: ok (play=${play.entries.length} apis=${apis.entries.length} kavex=${pin.kavexGameDevResources?.commit?.slice(0, 8)})`
);
