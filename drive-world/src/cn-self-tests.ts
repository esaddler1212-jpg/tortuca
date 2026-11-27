import { HEAT_MAX, heatLabel } from './game-heat';
import {
  NEAR_MISS_CHAIN_MAX,
  NEAR_MISS_MIN_MPH,
  NEAR_MISS_OUTER_M,
  createNearMissState,
  scanNearMiss
} from './near-miss-boost';
import type { HudSnapshot } from './game-bridge';
import { getHudSnapshot } from './game-bridge';

export type SelfTestRow = { name: string; ok: boolean; detail?: string };

export function runCityNightsSelfTests(): { ok: boolean; results: SelfTestRow[] } {
  const results: SelfTestRow[] = [];
  const row = (name: string, ok: boolean, detail?: string) => {
    results.push({ name, ok, detail });
  };

  row('HEAT_MAX', HEAT_MAX === 5);
  row('heatLabel cool', heatLabel(0) === 'Cool');
  row('heatLabel hunted', heatLabel(4.5) === 'Hunted');

  const far = scanNearMiss(0, 0, NEAR_MISS_MIN_MPH + 5, [{ x: 50, z: 0, key: 'a' }], createNearMissState(), 0, 0.016);
  row('near-miss ignores far traffic', !far.event);

  const hit = scanNearMiss(0, 0, 55, [{ x: 0.5, z: 0, key: 'b' }], createNearMissState(), 0, 0.016);
  row('near-miss ignores inside hit band', !hit.event);

  const band = NEAR_MISS_OUTER_M * 0.65;
  const near = scanNearMiss(0, 0, 48, [{ x: band, z: 0, key: 'c' }], createNearMissState(), 0, 0.016);
  row('near-miss triggers in band', Boolean(near.event), near.event?.body);
  row('near-miss chain capped', near.event!.chain <= NEAR_MISS_CHAIN_MAX);

  let state = createNearMissState();
  let chain = 0;
  for (let i = 0; i < 12; i++) {
    const r = scanNearMiss(0, 0, 60, [{ x: 4.5 + i * 0.01, z: 0, key: `d-${i}` }], state, i * 3.5, 0.016);
    state = r.state;
    if (r.event) chain = r.event.chain;
  }
  row('near-miss chain respects max', chain === NEAR_MISS_CHAIN_MAX);

  const hud = getHudSnapshot() as HudSnapshot;
  row('hud progress shape', hud.progress === null || typeof hud.progress.phase === 'string');
  row('hud settings preset', Boolean(hud.settings?.bayQualityPreset));

  const ok = results.every((r) => r.ok);
  return { ok, results };
}