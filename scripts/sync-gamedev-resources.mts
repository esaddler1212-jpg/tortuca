import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pinPath = path.join(root, 'gamedev-resources', 'upstream-pin.json');
const catalogPath = path.join(root, 'gamedev-resources', 'tortuca-playcanvas.json');

function shallowRev(repo: string, dir: string): string {
  rmSync(dir, { recursive: true, force: true });
  const clone = spawnSync('git', ['clone', '--depth', '1', repo, dir], { stdio: 'pipe', encoding: 'utf8' });
  if (clone.status !== 0) return '';
  const rev = spawnSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  return rev.stdout?.trim() ?? '';
}

const kavexRev = shallowRev('https://github.com/Kavex/GameDev-Resources.git', '/tmp/kavex-gdr-sync');
const apisRev = shallowRev('https://github.com/public-apis/public-apis.git', '/tmp/public-apis-sync');
const blockRev = shallowRev('https://github.com/JannisX11/blockbench.git', '/tmp/blockbench-sync');

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as { entries: unknown[] };

writeFileSync(
  pinPath,
  JSON.stringify(
    {
      syncedAt: new Date().toISOString(),
      kavexGameDevResources: kavexRev ? { repo: 'https://github.com/Kavex/GameDev-Resources', commit: kavexRev } : null,
      publicApis: apisRev ? { repo: 'https://github.com/public-apis/public-apis', commit: apisRev } : null,
      blockbench: blockRev ? { repo: 'https://github.com/JannisX11/blockbench', commit: blockRev } : null,
      githubCollectionGameEngines: 'https://github.com/collections/game-engines',
      catalogEntries: catalog.entries.length
    },
    null,
    2
  )
);

console.log(
  `sync-gamedev-resources: kavex=${kavexRev.slice(0, 8)} public-apis=${apisRev.slice(0, 8)} blockbench=${blockRev.slice(0, 8)}`
);
