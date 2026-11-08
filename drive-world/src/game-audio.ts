/** Procedural Web Audio — engine + landmark sting (no asset files). */

let ctx: AudioContext | null = null;
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;
let unlocked = false;
let masterVolume = 0.85;

export function setMasterVolume(v: number): void {
  masterVolume = Math.max(0, Math.min(1, v));
  void import('./game-music').then((m) => m.onMasterVolumeChanged(masterVolume));
}

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
    ctx.addEventListener('statechange', () => {
      if (!ctx) return;
      if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
        void ctx.resume().catch(() => {});
      }
    });
    return ctx;
  } catch {
    return null;
  }
}

export function unlockAudio(): void {
  const c = ensureContext();
  if (!c || unlocked) return;
  if (c.state === 'suspended') void c.resume();
  if (!engineOsc) {
    engineGain = c.createGain();
    engineGain.gain.value = 0;
    engineGain.connect(c.destination);
    engineOsc = c.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 55;
    engineOsc.connect(engineGain);
    engineOsc.start();
  }
  unlocked = true;
}

export function updateEngineAudio(mph: number, driving: boolean, exhaustGain = 1): void {
  if (!unlocked || !ctx || !engineGain || !engineOsc) return;
  const gain = Math.max(0.85, Math.min(1.6, exhaustGain));
  const targetVol = (driving && mph > 2 ? Math.min(0.1, (0.015 + mph * 0.0012) * gain) : 0) * masterVolume;
  engineGain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.08);
  const hz = 40 + mph * (1.25 + gain * 0.12);
  engineOsc.frequency.setTargetAtTime(hz, ctx.currentTime, 0.05);
}

export function playRaceTreeBeep(go = false): void {
  const c = ensureContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'square';
  o.frequency.value = go ? 880 : 440;
  g.gain.value = (go ? 0.11 : 0.07) * masterVolume;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (go ? 0.32 : 0.12));
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + (go ? 0.35 : 0.14));
}

export function playLandmarkChime(): void {
  const c = ensureContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'triangle';
  o.frequency.value = 520;
  g.gain.value = 0.12;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.4);
}

let heatSirenT = 0;

export function tickHeatSiren(heat: number, dt: number): void {
  if (heat < 3.6) return;
  heatSirenT += dt;
  if (heatSirenT < 9) return;
  heatSirenT = 0;
  playHeatSiren();
}

export function playHeatSiren(): void {
  const c = ensureContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(280, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.35);
  g.gain.value = 0.04 * masterVolume;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.55);
}

export function playVistaChime(): void {
  const c = ensureContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(660, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.25);
  g.gain.value = 0.1 * masterVolume;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.55);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.6);
}

export function playWaymoArrival(): void {
  const c = ensureContext();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(440, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(660, c.currentTime + 0.2);
  g.gain.value = 0.1;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.45);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.5);
}
