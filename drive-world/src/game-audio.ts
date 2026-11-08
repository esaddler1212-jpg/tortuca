/** Procedural Web Audio — engine + landmark sting (no asset files). */

let ctx: AudioContext | null = null;
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;
let unlocked = false;

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
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

export function updateEngineAudio(mph: number, driving: boolean): void {
  if (!unlocked || !ctx || !engineGain || !engineOsc) return;
  const targetVol = driving && mph > 2 ? Math.min(0.08, 0.015 + mph * 0.0012) : 0;
  engineGain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.08);
  const hz = 42 + mph * 1.35;
  engineOsc.frequency.setTargetAtTime(hz, ctx.currentTime, 0.05);
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
