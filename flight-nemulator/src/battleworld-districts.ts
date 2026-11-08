import type { BattleworldUniverse } from './battleworld';

/** Which homage universe “owns” each district rim on the Battleworld ring. */
export const DISTRICT_UNIVERSE: Record<string, BattleworldUniverse> = {
  metropolis: 'dc',
  'gotham-nights': 'dc',
  'coast-city': 'dc',
  'watchtower-annex': 'dc',
  'stark-nexus': 'marvel',
  'wakanda-gateway': 'marvel',
  'asgard-embassy': 'marvel',
  'sokovia-memorial': 'marvel',
  'ki-plateau': 'dbz'
};

export const UNIVERSE_RIM_RGB: Record<BattleworldUniverse, [number, number, number]> = {
  marvel: [0.72, 0.14, 0.18],
  dc: [0.12, 0.28, 0.62],
  dbz: [0.92, 0.58, 0.12]
};

export const UNIVERSE_FOG_TINT: Record<BattleworldUniverse, [number, number, number]> = {
  marvel: [0.06, 0.03, 0.08],
  dc: [0.03, 0.05, 0.12],
  dbz: [0.1, 0.05, 0.02]
};

export function universeForDistrict(districtId: string | null): BattleworldUniverse {
  if (!districtId) return 'marvel';
  return DISTRICT_UNIVERSE[districtId] ?? 'marvel';
}
