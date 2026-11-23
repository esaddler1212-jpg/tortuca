let ctx: AudioContext | null = null;
const sampleBuffers: AudioBuffer[] = [];
let samplesReady = false;

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

function playSample(buf: AudioBuffer | undefined, gain = 0.35): void {
  if (!buf) return;
  try {
    const c = ac();
    const src = c.createBufferSource();
    const g = c.createGain();
    src.buffer = buf;
    g.gain.value = gain;
    src.connect(g);
    g.connect(c.destination);
    src.start();
  } catch {
    /* ignore */
  }
}

function playRandomSample(): void {
  if (!sampleBuffers.length) return;
  const buf = sampleBuffers[Math.floor(Math.random() * sampleBuffers.length)];
  playSample(buf, 0.28);
}

/** Kenney CC0 interface sounds if installed via tools/gamedev-resources/install-free-packs.sh */
export async function preloadKenneySamples(): Promise<void> {
  if (samplesReady) return;
  samplesReady = true;
  const candidates = [
    './audio/kenney/confirmation_001.ogg',
    './audio/kenney/confirmation_002.ogg',
    './audio/kenney/select_001.ogg',
    './audio/kenney/back_001.ogg',
    './audio/kenney/click_001.ogg',
    './audio/kenney/click_002.ogg',
    './audio/kenney/switch_001.ogg',
    './audio/kenney/tick_001.ogg'
  ];
  const c = ac();
  await Promise.all(
    candidates.map(async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const ab = await res.arrayBuffer();
        const buf = await c.decodeAudioData(ab.slice(0));
        sampleBuffers.push(buf);
      } catch {
        /* pack not installed */
      }
    })
  );
}

export function bootAudioFromGesture(): void {
  void ac().resume();
  void preloadKenneySamples();
}

export function playWhoosh(): void {
  if (sampleBuffers.length) playRandomSample();
  else tone(180 + Math.random() * 40, 0.12, 'sawtooth', 0.03);
}

export function playBlast(kind: 'beam' | 'repulsor' | 'thunder' | 'ki' | 'default'): void {
  if (sampleBuffers.length) {
    playSample(sampleBuffers[0], 0.22);
    return;
  }
  const map = { beam: 440, repulsor: 520, thunder: 90, ki: 680, default: 360 } as const;
  tone(map[kind] ?? map.default, 0.08, kind === 'thunder' ? 'square' : 'triangle', 0.05);
}

export function playSmash(): void {
  if (sampleBuffers.length > 1) playSample(sampleBuffers[1], 0.4);
  else tone(70, 0.18, 'square', 0.07);
}

export function playSuper(): void {
  if (sampleBuffers.length) playRandomSample();
  else {
    tone(120, 0.35, 'sawtooth', 0.08);
    window.setTimeout(() => tone(60, 0.4, 'square', 0.06), 80);
  }
}

export function playWaveAlert(): void {
  if (sampleBuffers.length) playSample(sampleBuffers[sampleBuffers.length - 1], 0.3);
  else tone(880, 0.06, 'sine', 0.04);
}
