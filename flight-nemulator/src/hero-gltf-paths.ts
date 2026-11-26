/** Optional Blockbench/Kenney GLBs under public/models/heroes/<id>.glb */

export const BUNDLED_HERO_GLB_IDS = [
  'tin-aviator',
  'solar-apex',
  'wall-crawler',
  'emerald-pilot',
  'storm-hammer',
  'chrome-sage',
  'jade-architect',
  'garnet-brawler',
  'spectrum-artist',
  'ki-sage',
  'time-blade'
] as const;

const OVERRIDES: Record<string, string> = {
  'tin-aviator': './models/heroes/tin-aviator.glb',
  'solar-apex': './models/heroes/solar-apex.glb',
  'wall-crawler': './models/heroes/wall-crawler.glb',
  'emerald-pilot': './models/heroes/emerald-pilot.glb',
  'storm-hammer': './models/heroes/storm-hammer.glb',
  'chrome-sage': './models/heroes/chrome-sage.glb',
  'jade-architect': './models/heroes/jade-architect.glb',
  'garnet-brawler': './models/heroes/garnet-brawler.glb',
  'spectrum-artist': './models/heroes/spectrum-artist.glb',
  'ki-sage': './models/heroes/ki-sage.glb',
  'time-blade': './models/heroes/time-blade.glb'
};

export function glbPathForHero(heroId: string): string {
  return OVERRIDES[heroId] ?? `./models/heroes/${heroId}.glb`;
}
