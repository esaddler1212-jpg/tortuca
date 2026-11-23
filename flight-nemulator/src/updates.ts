export type ContentManifest = {
  version: number;
  characters: { id: string; codename: string; bundleUrl?: string }[];
  skins: { id: string; heroId: string; label: string }[];
  suggestions?: { title: string; url: string; source: string }[];
};

const MANIFEST_URL = './manifest-updates.json';
const LS_KEY = 'flight-nemulator-manifest';

const FREETOGAME = 'https://www.freetogame.com/api/games?platform=browser';
const GAMERPOWER = 'https://www.gamerpower.com/api/giveaways';

export function loadCachedManifest(): ContentManifest | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ContentManifest;
  } catch {
    return null;
  }
}

function mergeManifest(base: ContentManifest, extra: Partial<ContentManifest>): ContentManifest {
  return {
    ...base,
    ...extra,
    characters: [...base.characters, ...(extra.characters ?? [])],
    skins: [...base.skins, ...(extra.skins ?? [])],
    suggestions: [...(base.suggestions ?? []), ...(extra.suggestions ?? [])]
  };
}

async function fetchFreeToGameHints(): Promise<ContentManifest['suggestions']> {
  try {
    const res = await fetch(FREETOGAME);
    if (!res.ok) return [];
    const games = (await res.json()) as { id: number; title: string; game_url: string }[];
    return games.slice(0, 5).map((g) => ({
      title: g.title,
      url: g.game_url,
      source: 'freetogame'
    }));
  } catch {
    return [];
  }
}

async function fetchGamerPowerHints(): Promise<ContentManifest['suggestions']> {
  try {
    const res = await fetch(GAMERPOWER);
    if (!res.ok) return [];
    const data = (await res.json()) as { title: string; open_giveaway_url: string }[];
    return data.slice(0, 3).map((g) => ({
      title: g.title,
      url: g.open_giveaway_url,
      source: 'gamerpower'
    }));
  } catch {
    return [];
  }
}

export async function fetchManifestIfOnline(): Promise<ContentManifest | null> {
  let base: ContentManifest = {
    version: 1,
    characters: [],
    skins: [],
    suggestions: []
  };

  if (navigator.onLine) {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      if (res.ok) base = (await res.json()) as ContentManifest;
    } catch {
      /* local only */
    }
  } else {
    return loadCachedManifest();
  }

  const [ftg, gp] = await Promise.all([fetchFreeToGameHints(), fetchGamerPowerHints()]);
  const merged = mergeManifest(base, {
    version: Math.max(base.version, 2),
    suggestions: [...(ftg ?? []), ...(gp ?? [])]
  });
  localStorage.setItem(LS_KEY, JSON.stringify(merged));
  return merged;
}

export function getManifestSuggestions(): ContentManifest['suggestions'] {
  return loadCachedManifest()?.suggestions ?? [];
}
