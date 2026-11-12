import { search3dTexel, type TexelHit } from './asset-research';

/**
 * Offline-first stub for a future Tortuca research agent.
 * When wired, POST `{ theme: string }` to a signed Netlify handler that returns
 * homage-safe hero drafts (never trademarked names).
 */

export type ResearchedHeroDraft = {
  codename: string;
  tagline: string;
  suggestedDistrictId: string;
  powers: string[];
};

const RESEARCH_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_FN_RESEARCH_URL?: string } }).env?.VITE_FN_RESEARCH_URL) ||
  '/api/flight-nemulator-research';

export type HeroResearchBundle = {
  drafts: ResearchedHeroDraft[];
  cc0Assets: TexelHit[];
};

export async function researchNewHeroIdeas(theme: string): Promise<ResearchedHeroDraft[]> {
  const bundle = await researchHeroBundle(theme);
  return bundle.drafts;
}

export async function researchHeroBundle(theme: string): Promise<HeroResearchBundle> {
  const assetQuery = `${theme} superhero sci-fi texture`.trim();
  const cc0Assets = navigator.onLine ? await search3dTexel(assetQuery, 'pbr') : [];

  if (!navigator.onLine) {
    return { drafts: offlineSuggestions(theme), cc0Assets };
  }
  try {
    const res = await fetch(RESEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme })
    });
    if (!res.ok) return { drafts: offlineSuggestions(theme), cc0Assets };
    const data = (await res.json()) as { drafts?: ResearchedHeroDraft[] };
    const drafts = data.drafts?.length ? data.drafts : offlineSuggestions(theme);
    return { drafts, cc0Assets };
  } catch {
    return { drafts: offlineSuggestions(theme), cc0Assets };
  }
}

function offlineSuggestions(theme: string): ResearchedHeroDraft[] {
  const t = theme.toLowerCase();
  const base: ResearchedHeroDraft[] = [
    {
      codename: 'Star Sentinel',
      tagline: 'Cosmic shield diver',
      suggestedDistrictId: 'watchtower-annex',
      powers: ['beam', 'telekinesis']
    },
    {
      codename: 'Mist Acrobat',
      tagline: 'Fog-step infiltrator',
      suggestedDistrictId: 'gotham-nights',
      powers: ['web', 'telekinesis']
    }
  ];
  if (t.includes('tech')) {
    base.push({
      codename: 'Circuit Ghost',
      tagline: 'Hologram flanker',
      suggestedDistrictId: 'stark-nexus',
      powers: ['repulsor', 'synth']
    });
  }
  return base;
}
