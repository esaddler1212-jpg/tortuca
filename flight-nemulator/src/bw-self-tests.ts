import { BATTLEWORLD_CHAPTER_CAMPAIGN } from './battleworld-chapters';
import { getHudSnapshot } from './game-bridge';

export type SelfTestRow = { name: string; ok: boolean; detail?: string };

export function runBattleworldSelfTests(): { ok: boolean; results: SelfTestRow[] } {
  const results: SelfTestRow[] = [];
  const row = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail });

  row('campaign chapters', BATTLEWORLD_CHAPTER_CAMPAIGN.length >= 6, String(BATTLEWORLD_CHAPTER_CAMPAIGN.length));
  row('campaign ends fate', BATTLEWORLD_CHAPTER_CAMPAIGN.at(-1) === 'fate');

  const hud = getHudSnapshot();
  row('hud codename string', typeof hud.codename === 'string' && hud.codename.length > 0);
  row('hud wave number', typeof hud.wave === 'number' && hud.wave >= 0);
  row('hud stamina bounds', hud.stamina >= 0 && hud.staminaMax > 0 && hud.stamina <= hud.staminaMax);

  const ok = results.every((r) => r.ok);
  return { ok, results };
}