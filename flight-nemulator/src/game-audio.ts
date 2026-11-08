let ctx: AudioContext | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.06): void {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(c.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.stop(c.currentTime + dur);
  } catch {
    /* autoplay blocked until gesture */
  }
}

export function bootAudioFromGesture(): void {
  void ac().resume();
}

export function playWhoosh(): void {
  tone(180 + Math.random() * 40, 0.12, 'sawtooth', 0.03);
}

export function playBlast(kind: 'beam' | 'repulsor' | 'thunder' | 'ki' | 'default'): void {
  const map = { beam: 440, repulsor: 520, thunder: 90, ki: 680, default: 360 } as const;
  tone(map[kind] ?? map.default, 0.08, kind === 'thunder' ? 'square' : 'triangle', 0.05);
}

export function playSmash(): void {
  tone(70, 0.18, 'square', 0.07);
}

export function playSuper(): void {
  tone(120, 0.35, 'sawtooth', 0.08);
  window.setTimeout(() => tone(60, 0.4, 'square', 0.06), 80);
}

export function playWaveAlert(): void {
  tone(880, 0.06, 'sine', 0.04);
}
