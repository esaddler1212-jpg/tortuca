/** Optional Blockbench/Kenney GLBs under public/models/heroes/<id>.glb */

const OVERRIDES: Record<string, string> = {
  'tin-aviator': './models/heroes/tin-aviator.glb',
  'solar-apex': './models/heroes/solar-apex.glb'
};

export function glbPathForHero(heroId: string): string {
  return OVERRIDES[heroId] ?? `./models/heroes/${heroId}.glb`;
}
