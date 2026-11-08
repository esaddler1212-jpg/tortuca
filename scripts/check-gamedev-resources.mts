import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const catalog = path.join(root, 'gamedev-resources', 'tortuca-playcanvas.json');
const pin = path.join(root, 'gamedev-resources', 'upstream-pin.json');
const install = path.join(root, 'tools/gamedev-resources/install-free-packs.sh');

for (const f of [catalog, pin, install]) {
  if (!existsSync(f)) {
    console.error(`gamedev-resources missing ${f}`);
    process.exit(1);
  }
}

const data = JSON.parse(readFileSync(catalog, 'utf8')) as { entries: unknown[] };
if (!data.entries?.length) {
  console.error('tortuca-playcanvas.json has no entries');
  process.exit(1);
}

console.log(`check-gamedev-resources: ok (${data.entries.length} entries, upstream ${JSON.parse(readFileSync(pin, 'utf8')).commit?.slice(0, 8)})`);
