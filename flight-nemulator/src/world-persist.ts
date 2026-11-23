/** Saved Earth shape after villain remake or hero victory. */

export type VillainWorldTheme = {
  rulerId: string;
  rulerName: string;
  color: [number, number, number];
  generation: number;
};

export type HeroMonument = {
  heroId: string;
  codename: string;
  districtId: string;
  color: [number, number, number];
};

const THEME_KEY = 'flight-nemulator-villain-theme';
const MONUMENT_KEY = 'flight-nemulator-hero-monument';

export function loadVillainTheme(): VillainWorldTheme | null {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VillainWorldTheme;
  } catch {
    return null;
  }
}

export function saveVillainTheme(theme: VillainWorldTheme): void {
  localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  localStorage.removeItem(MONUMENT_KEY);
}

export function clearVillainTheme(): void {
  localStorage.removeItem(THEME_KEY);
}

export function loadHeroMonument(): HeroMonument | null {
  try {
    const raw = localStorage.getItem(MONUMENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HeroMonument;
  } catch {
    return null;
  }
}

export function saveHeroMonument(m: HeroMonument): void {
  localStorage.setItem(MONUMENT_KEY, JSON.stringify(m));
  localStorage.removeItem(THEME_KEY);
}

export function clearHeroMonument(): void {
  localStorage.removeItem(MONUMENT_KEY);
}
