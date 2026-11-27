/** Neon Drift–style near-miss → nitro refill with chain (CN-OG-02). */

export const NEAR_MISS_INNER_M = 2.25;
export const NEAR_MISS_OUTER_M = 7.2;
export const NEAR_MISS_MIN_MPH = 34;
export const NEAR_MISS_COOLDOWN_S = 2.75;
export const NEAR_MISS_CHAIN_DECAY_S = 4.25;
export const NEAR_MISS_CHAIN_MAX = 8;

export type NearMissTarget = { x: number; z: number; key: string };

export type NearMissState = {
  chain: number;
  chainAge: number;
  lastTrigger: Record<string, number>;
};

export type NearMissEvent = {
  chain: number;
  nitroGain: number;
  body: string;
};

export function createNearMissState(): NearMissState {
  return { chain: 0, chainAge: 0, lastTrigger: {} };
}

export function scanNearMiss(
  px: number,
  pz: number,
  mph: number,
  targets: NearMissTarget[],
  state: NearMissState,
  now: number,
  dt: number
): { state: NearMissState; event?: NearMissEvent } {
  let chain = state.chain;
  let chainAge = state.chainAge + dt;
  if (chainAge > NEAR_MISS_CHAIN_DECAY_S) {
    chain = 0;
    chainAge = 0;
  }
  if (mph < NEAR_MISS_MIN_MPH) {
    return { state: { chain, chainAge, lastTrigger: state.lastTrigger } };
  }

  const lastTrigger = { ...state.lastTrigger };
  for (const t of targets) {
    const d = Math.hypot(px - t.x, pz - t.z);
    if (d < NEAR_MISS_INNER_M || d > NEAR_MISS_OUTER_M) continue;
    const last = lastTrigger[t.key] ?? -1e9;
    if (now - last < NEAR_MISS_COOLDOWN_S) continue;
    lastTrigger[t.key] = now;
    chain = Math.min(NEAR_MISS_CHAIN_MAX, chain + 1);
    chainAge = 0;
    const nitroGain = 0.065 + chain * 0.032;
    const body = chain > 1 ? `Chain ×${chain} · nitro +${Math.round(nitroGain * 100)}%` : `Close pass · nitro +${Math.round(nitroGain * 100)}%`;
    return {
      state: { chain, chainAge, lastTrigger },
      event: { chain, nitroGain, body }
    };
  }

  return { state: { chain, chainAge, lastTrigger } };
}