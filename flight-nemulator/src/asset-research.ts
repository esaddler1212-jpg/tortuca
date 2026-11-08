/** Browser-safe CC0 search via 3DTexel public API (no key). */

export type TexelHit = {
  id: number;
  title: string;
  type: string;
  url: string;
  license?: string;
};

const BASE = 'https://3dtexel.com/wp-json/3dtexel/v1/public';

export async function search3dTexel(query: string, type = 'pbr'): Promise<TexelHit[]> {
  if (!navigator.onLine || !query.trim()) return [];
  try {
    const q = encodeURIComponent(query.trim().slice(0, 80));
    const res = await fetch(`${BASE}/search?q=${q}&type=${encodeURIComponent(type)}&per_page=5`);
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: TexelHit[] };
    return (data.items ?? []).filter((i) => /cc0|public domain/i.test(i.license ?? ''));
  } catch {
    return [];
  }
}
