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

const RESEARCH_URL = '/api/flight-nemulator-research';

export async function researchNewHeroIdeas(theme: string): Promise<ResearchedHeroDraft[]> {
  if (!navigator.onLine) {
    return offlineSuggestions(theme);
  }
  try {
    const res = await fetch(RESEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme })
    });
    if (!res.ok) return offlineSuggestions(theme);
    const data = (await res.json()) as { drafts?: ResearchedHeroDraft[] };
    return data.drafts?.length ? data.drafts : offlineSuggestions(theme);
  } catch {
    return offlineSuggestions(theme);
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
