export type QualityTier = 'low' | 'medium' | 'high';

import { qualityOverride } from './game-settings';

const AUTO_KEY = 'flight-nemulator-quality-auto-sampled';
const PROBE_FRAMES = 90;

let probeFrames = 0;
let probeMs = 0;
let probeDone = false;

export function detectQualityTier(): QualityTier {
  const forced = qualityOverride();
  if (forced) return forced;
  try {
    const stored = localStorage.getItem(AUTO_KEY);
    if (stored === 'low' || stored === 'medium' || stored === 'high') return stored;
  } catch {
    /* */
  }
  return heuristicQualityTier();
}

function heuristicQualityTier(): QualityTier {
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (coarse && mem <= 4) return 'low';
  if (cores <= 4 || mem <= 4) return 'medium';
  return 'high';
}

/** Simply City / World Craft style — sample frame times for ~1.5s, then persist auto tier. */
export function tickQualityProbe(dt: number): void {
  if (qualityOverride() || probeDone) return;
  probeFrames++;
  probeMs += dt * 1000;
  if (probeFrames < PROBE_FRAMES) return;
  probeDone = true;
  const avgMs = probeMs / probeFrames;
  let tier: QualityTier = 'high';
  if (avgMs > 22) tier = 'low';
  else if (avgMs > 14) tier = 'medium';
  try {
    localStorage.setItem(AUTO_KEY, tier);
  } catch {
    /* */
  }
}

export function resetQualityProbeForTests(): void {
  probeFrames = 0;
  probeMs = 0;
  probeDone = false;
}

export function debrisEnabled(tier: QualityTier): boolean {
  return tier !== 'low';
}

export function particlesLite(tier: QualityTier): boolean {
  return tier === 'high';
}