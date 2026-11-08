/** Procedural night cruise radio — no licensed audio files. */

import { loadSettings, saveSettings, type GameSettings } from './game-settings';

export type MusicStationId = 'off' | 'ambient' | 'synth' | 'lofi' | 'pulse';

export const MUSIC_STATIONS: { id: MusicStationId; label: string }[] = [
  { id: 'off', label: 'Radio off' },
  { id: 'ambient', label: 'Bay ambient' },
  { id: 'synth', label: 'Synth cruise' },
  { id: 'lofi', label: 'Late FM' },
  { id: 'pulse', label: 'Night pulse' }
];

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let nodes: AudioNode[] = [];
let station: MusicStationId = 'ambient';
let playing = false;

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
    return ctx;
  } catch {
    return null;
  }
}

function stopNodes(): void {
  for (const n of nodes) {
    try {
      if ('stop' in n && typeof (n as OscillatorNode).stop === 'function') {
        (n as OscillatorNode).stop();
      }
      n.disconnect();
    } catch {
      /* */
    }
  }
  nodes = [];
}

function addOsc(
  c: AudioContext,
  type: OscillatorType,
  freq: number,
  gain: number,
  dest: AudioNode
): void {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = gain;
  o.connect(g);
  g.connect(dest);
  o.start();
  nodes.push(o, g);
}

function buildStation(c: AudioContext, id: MusicStationId, bus: GainNode): void {
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = id === 'synth' ? 680 : 420;
  filter.Q.value = 0.7;
  filter.connect(bus);
  nodes.push(filter);

  const lfo = c.createOscillator();
  lfo.frequency.value = id === 'pulse' ? 0.12 : 0.04;
  const lfoG = c.createGain();
  lfoG.gain.value = id === 'synth' ? 120 : 18;
  lfo.connect(lfoG);
  lfoG.connect(filter.frequency);
  lfo.start();
  nodes.push(lfo, lfoG);

  if (id === 'ambient') {
    addOsc(c, 'sine', 55, 0.06, filter);
    addOsc(c, 'sine', 82.5, 0.04, filter);
    addOsc(c, 'triangle', 110, 0.02, filter);
  } else if (id === 'synth') {
    addOsc(c, 'sawtooth', 65.4, 0.018, filter);
    addOsc(c, 'sawtooth', 98.1, 0.012, filter);
    addOsc(c, 'sine', 130.8, 0.008, filter);
  } else if (id === 'lofi') {
    addOsc(c, 'triangle', 73.4, 0.035, filter);
    addOsc(c, 'triangle', 110, 0.02, filter);
    const noise = c.createOscillator();
    noise.type = 'sawtooth';
    noise.frequency.value = 42;
    const ng = c.createGain();
    ng.gain.value = 0.004;
    noise.connect(ng);
    ng.connect(filter);
    noise.start();
    nodes.push(noise, ng);
  } else if (id === 'pulse') {
    addOsc(c, 'square', 49, 0.012, filter);
    addOsc(c, 'sine', 98, 0.025, filter);
    addOsc(c, 'triangle', 147, 0.015, filter);
  }
}

function applyGainFromSettings(): void {
  if (!masterGain || !ctx) return;
  const s = loadSettings();
  const vol = (s.musicVolume ?? 0.55) * (s.masterVolume ?? 0.85);
  masterGain.gain.setTargetAtTime(playing && station !== 'off' ? vol : 0, ctx.currentTime, 0.12);
}

export function unlockMusic(): void {
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const s = loadSettings();
  if (s.musicEnabled !== false && s.musicStation !== 'off') {
    void startMusic(s.musicStation ?? 'ambient');
  }
}

export function startMusic(next: MusicStationId): void {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  if (c.state === 'suspended') void c.resume();
  station = next;
  stopNodes();
  playing = next !== 'off';
  if (next !== 'off') {
    buildStation(c, next, masterGain);
  }
  applyGainFromSettings();
  const s = loadSettings();
  saveSettings({ ...s, musicStation: next, musicEnabled: next !== 'off' });
}

export function toggleMusicPlay(): boolean {
  const s = loadSettings();
  if (playing && station !== 'off') {
    stopNodes();
    playing = false;
    applyGainFromSettings();
    return false;
  }
  const st = s.musicStation === 'off' ? 'ambient' : s.musicStation;
  startMusic(st);
  return true;
}

export function cycleMusicStation(dir: 1 | -1 = 1): MusicStationId {
  const ids = MUSIC_STATIONS.map((x) => x.id).filter((id) => id !== 'off');
  const cur = loadSettings().musicStation ?? 'ambient';
  let idx = ids.indexOf(cur === 'off' ? 'ambient' : cur);
  if (idx < 0) idx = 0;
  idx = (idx + dir + ids.length) % ids.length;
  const next = ids[idx]!;
  startMusic(next);
  return next;
}

export function setMusicVolume(v: number): void {
  const s = loadSettings();
  saveSettings({ ...s, musicVolume: v });
  applyGainFromSettings();
}

export function getMusicState(): { station: MusicStationId; playing: boolean; label: string } {
  const s = loadSettings();
  const st = s.musicStation ?? station;
  const label = MUSIC_STATIONS.find((x) => x.id === st)?.label ?? 'Radio';
  return { station: st, playing: playing && st !== 'off', label };
}

export function onMasterVolumeChanged(master: number): void {
  if (masterGain && ctx) {
    const s = loadSettings();
    const vol = (s.musicVolume ?? 0.55) * master;
    if (playing && station !== 'off') {
      masterGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.08);
    }
  }
}
