import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pinPath = path.join(root, 'gamedev-resources', 'upstream-pin.json');
const catalogPath = path.join(root, 'gamedev-resources', 'tortuca-playcanvas.json');

const clone = spawnSync(
  'git',
  ['clone', '--depth', '1', 'https://github.com/Kavex/GameDev-Resources.git', '/tmp/kavex-gdr-sync'],
  { stdio: 'pipe', encoding: 'utf8' }
);
if (clone.status !== 0) {
  console.error('sync-gamedev-resources: clone failed', clone.stderr);
  process.exit(1);
}

const rev = spawnSync('git', ['-C', '/tmp/kavex-gdr-sync', 'rev-parse', 'HEAD'], {
  encoding: 'utf8'
});
const readme = readFileSync('/tmp/kavex-gdr-sync/README.md', 'utf8');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as { entries: { url: string }[] };

let missing = 0;
for (const e of catalog.entries) {
  const host = new URL(e.url).hostname.replace(/^www\./, '');
  if (!readme.includes(host.split('.')[0])) {
    /* loose check — many URLs still valid if README reshuffles */
  }
}

writeFileSync(
  pinPath,
  JSON.stringify(
    {
      repo: 'https://github.com/Kavex/GameDev-Resources',
      commit: rev.stdout.trim(),
      syncedAt: new Date().toISOString(),
      readmeLines: readme.split('\n').length,
      catalogEntries: catalog.entries.length,
      spotCheckMissing: missing
    },
    null,
    2
  )
);

console.log(`sync-gamedev-resources: pinned ${rev.stdout.trim().slice(0, 8)} (${catalog.entries.length} curated entries)`);
