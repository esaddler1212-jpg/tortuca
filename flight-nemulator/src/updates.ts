export type ContentManifest = {
  version: number;
  characters: { id: string; codename: string; bundleUrl?: string }[];
  skins: { id: string; heroId: string; label: string }[];
};

const MANIFEST_URL = './manifest-updates.json';
const LS_KEY = 'flight-nemulator-manifest';

export function loadCachedManifest(): ContentManifest | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ContentManifest;
  } catch {
    return null;
  }
}

export async function fetchManifestIfOnline(): Promise<ContentManifest | null> {
  if (!navigator.onLine) return loadCachedManifest();
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!res.ok) return loadCachedManifest();
    const data = (await res.json()) as ContentManifest;
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    return data;
  } catch {
    return loadCachedManifest();
  }
}
