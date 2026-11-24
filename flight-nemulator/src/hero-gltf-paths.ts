/** Optional Blockbench/Kenney GLBs under public/models/heroes/<id>.glb */

const OVERRIDES: Record<string, string> = {
  'tin-aviator': './models/heroes/tin-aviator.glb',
  'solar-apex': './models/heroes/solar-apex.glb',
  'wall-crawler': './models/heroes/wall-crawler.glb',
  'emerald-pilot': './models/heroes/emerald-pilot.glb',
  'storm-hammer': './models/heroes/storm-hammer.glb',
  'chrome-sage': './models/heroes/chrome-sage.glb'
};

export function glbPathForHero(heroId: string): string {
  return OVERRIDES[heroId] ?? `./models/heroes/${heroId}.glb`;
}
