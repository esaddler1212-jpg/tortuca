import type { BayQualityPreset } from './bay-quality';
import type { DistrictId } from './world-config';

const CLIENT_KEY = 'city-nights-telemetry-client';
const API = import.meta.env.VITE_CITY_NIGHTS_TELEMETRY ?? '/.netlify/functions/city-nights-telemetry';

type FlushPayload = {
  clientId: string;
  sessionSec: number;
  preset: BayQualityPreset;
  district: DistrictId | null;
  phase: string;
};

let sessionStartMs = Date.now();
let lastFlushMs = 0;

export function getTelemetryClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_KEY);
    if (existing && /^cn-tel-[0-9a-f-]{16,}$/i.test(existing)) return existing;
    const id = `cn-tel-${crypto.randomUUID()}`;
    localStorage.setItem(CLIENT_KEY, id);
    return id;
  } catch {
    return 'cn-tel-anonymous';
  }
}

export function sessionElapsedSec(): number {
  return Math.round((Date.now() - sessionStartMs) / 1000);
}

export function markSessionBoot(): void {
  sessionStartMs = Date.now();
}

const MIN_FLUSH_GAP_MS = 55_000;

export function flushSessionTelemetry(
  enabled: boolean,
  payload: Omit<FlushPayload, 'clientId' | 'sessionSec'>
): void {
  if (!enabled) return;
  const now = Date.now();
  if (now - lastFlushMs < MIN_FLUSH_GAP_MS && payload.phase === 'home') return;
  lastFlushMs = now;
  const body: FlushPayload = {
    clientId: getTelemetryClientId(),
    sessionSec: sessionElapsedSec(),
    ...payload
  };
  const json = JSON.stringify(body);
  try {
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(API, new Blob([json], { type: 'application/json' }));
      return;
    }
  } catch {
    /* */
  }
  void fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json, keepalive: true });
}

export function installSessionTelemetryFlush(
  readEnabled: () => boolean,
  readState: () => Omit<FlushPayload, 'clientId' | 'sessionSec'>
): void {
  const send = () => flushSessionTelemetry(readEnabled(), readState());
  window.addEventListener('pagehide', send);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') send();
  });
}
