/** cn-d09 — ACE-Step bed in catalog + playlist helpers. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  aceStepBedFile,
  loadPlaylistCatalog,
  playlistIndexForFile
} from '../drive-world/src/music-playlist.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = true;
};

const catalog = JSON.parse(
  fs.readFileSync(path.join(root, 'tools/ace-step/city-nights-tracks.json'), 'utf8')
) as { tracks: { file: string; aceStepBed?: boolean }[] };
ok('ace-step track in render catalog', catalog.tracks.some((t) => t.aceStepBed));

const playlist = JSON.parse(
  fs.readFileSync(path.join(root, 'drive-world/public/music/playlist.json'), 'utf8')
) as { tracks: { file: string; aceStepBed?: boolean }[] };
ok('ace bed in shipped playlist', playlist.tracks.some((t) => t.file.includes('ace-step')));

const musicDir = path.join(root, 'drive-world/public/music');
const bedFile = catalog.tracks.find((t) => t.aceStepBed)?.file;
ok('ace bed audio on disk', bedFile ? fs.existsSync(path.join(musicDir, bedFile)) : false);

const settingsSrc = fs.readFileSync(path.join(root, 'drive-world/src/game-settings.ts'), 'utf8');
ok('settings remember ace bed file', settingsSrc.includes('musicAceStepBedFile'));

const panelSrc = fs.readFileSync(path.join(root, 'drive-world/src/hud/MusicPanel.tsx'), 'utf8');
ok('music panel ace swap', panelSrc.includes('ACE finish bed'));

const playlistPath = path.join(root, 'drive-world/public/music/playlist.json');
(globalThis as { fetch?: typeof fetch }).fetch = async (input) => {
  const url = String(input);
  if (url.includes('playlist.json')) {
    return new Response(fs.readFileSync(playlistPath, 'utf8'), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response('', { status: 404 });
};

await loadPlaylistCatalog();
const file = aceStepBedFile();
ok('aceStepBedFile resolves', Boolean(file));
if (file) ok('playlist index for ace bed', playlistIndexForFile(file) >= 0);

if (failed) process.exitCode = 1;
else console.log('check-playlist-ace: ok');