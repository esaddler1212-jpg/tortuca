#!/usr/bin/env node
/**
 * Build City Nights playlist tracks via ACE-Step API (local GPU) or ffmpeg ambient fallback (no GPU).
 *
 * API:  ACESTEP_API_URL=http://127.0.0.1:8001 node tools/ace-step/render-city-nights-playlist.mjs
 * CPU:  node tools/ace-step/render-city-nights-playlist.mjs --fallback-only
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const MUSIC_DIR = join(ROOT, 'drive-world/public/music');
const CONFIG = join(__dirname, 'city-nights-tracks.json');
const API = (process.env.ACESTEP_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '');
const fallbackOnly = process.argv.includes('--fallback-only');

const catalog = JSON.parse(readFileSync(CONFIG, 'utf8'));

async function apiHealthy() {
  if (fallbackOnly) return false;
  try {
    const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    try {
      const res = await fetch(`${API}/`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}

async function releaseTask(track) {
  const body = {
    prompt: track.prompt,
    audio_duration: track.duration ?? 95,
    bpm: track.bpm,
    instrumental: true,
    lyrics: ''
  };
  const res = await fetch(`${API}/release_task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(process.env.ACESTEP_API_KEY ? { Authorization: `Bearer ${process.env.ACESTEP_API_KEY}` } : {}) },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (json.code !== 200 || !json.data?.task_id) {
    throw new Error(json.error ?? 'release_task failed');
  }
  return json.data.task_id;
}

async function waitForTask(taskId, maxMs = 600_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const res = await fetch(`${API}/query_result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id_list: [taskId] })
    });
    const json = await res.json();
    const row = json.data?.results?.[0] ?? json.data?.[0];
    const status = row?.status ?? row?.task_status;
    if (status === 1) return row;
    if (status === 2) throw new Error(row?.error ?? 'generation failed');
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error('timeout waiting for ACE-Step');
}

async function downloadAudio(result, outWav) {
  const url = result.audio_url ?? result.url ?? result.output_url;
  const path = result.audio_path ?? result.file_path;
  if (url) {
    const res = await fetch(url.startsWith('http') ? url : `${API}${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(outWav, buf);
    return;
  }
  if (path) {
    copyFileSync(path, outWav);
    return;
  }
  throw new Error('no audio path in task result');
}

function ffmpegOgg(wav, ogg) {
  const r = spawnSync('ffmpeg', ['-y', '-i', wav, '-c:a', 'libvorbis', '-q:a', '6', ogg], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${ogg}`);
}

function renderFallback(track, oggPath) {
  const d = track.duration ?? 95;
  const bass = track.bpm ? Math.round(2200 / track.bpm) : 60;
  const pad = bass * 2;
  const pad2 = Math.round(pad * 1.26);
  const filter = [
    `[0:a]volume=0.06,lowpass=f=600[a0]`,
    `[1:a]volume=0.07,lowpass=f=900[a1]`,
    `[2:a]volume=0.05,lowpass=f=500[a2]`,
    `[3:a]aformat=sample_rates=44100:channel_layouts=mono,volume=0.04,lowpass=f=2500[a3]`,
    `[a0][a1][a2][a3]amix=inputs=4:duration=first:dropout_transition=0[a4]`,
    `[a4]volume=0.85,afade=t=in:st=0:d=4,afade=t=out:st=${d - 4}:d=4,highpass=f=40[aout]`
  ].join(';');
  const args = [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=${bass}:duration=${d}`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=${pad}:duration=${d}`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=${pad2}:duration=${d}`,
    '-f',
    'lavfi',
    '-i',
    `anoisesrc=d=${d}:c=pink:amplitude=0.08`,
    '-filter_complex',
    filter,
    '-map',
    '[aout]',
    '-c:a',
    'libvorbis',
    '-q:a',
    '5',
    oggPath
  ];
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`fallback ffmpeg failed: ${track.file}`);
}

async function main() {
  mkdirSync(MUSIC_DIR, { recursive: true });
  const useApi = await apiHealthy();
  const mode = useApi ? 'acestep-api' : 'ffmpeg-fallback';
  console.log(`City Nights music render — mode: ${mode}`);

  const playlistTracks = [];

  for (const track of catalog.tracks) {
    const ogg = join(MUSIC_DIR, track.file);
    if (useApi) {
      const wav = join(MUSIC_DIR, track.file.replace(/\.ogg$/, '.wav'));
      console.log(`ACE-Step: ${track.title}`);
      const taskId = await releaseTask(track);
      const result = await waitForTask(taskId);
      await downloadAudio(result, wav);
      ffmpegOgg(wav, ogg);
    } else {
      console.log(`Fallback synth: ${track.title}`);
      renderFallback(track, ogg);
    }
    playlistTracks.push({ file: track.file, title: track.title });
  }

  const existing = JSON.parse(readFileSync(join(MUSIC_DIR, 'playlist.json'), 'utf8'));
  const byFile = new Map((existing.tracks ?? []).map((t) => [t.file, t]));
  for (const t of playlistTracks) byFile.set(t.file, t);
  const merged = { tracks: [...byFile.values()] };
  writeFileSync(join(MUSIC_DIR, 'playlist.json'), `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`Updated playlist (${merged.tracks.length} tracks). Mode: ${mode}`);
  if (!useApi) {
    console.log('Tip: on your Mac/GPU run: uv run acestep-api && ACESTEP_API_URL=http://127.0.0.1:8001 node tools/ace-step/render-city-nights-playlist.mjs');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
