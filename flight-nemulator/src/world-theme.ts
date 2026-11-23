import { Color, type AppBase } from 'playcanvas';
import { DISTRICTS } from './districts';
import type { HeroForm, HeroSpec } from './hero-roster';

const savedAccents = new Map<string, [number, number, number]>();

export function applyVillainThemeTint(color: [number, number, number], strength = 0.62): void {
  savedAccents.clear();
  for (const d of DISTRICTS) {
    savedAccents.set(d.id, [d.accent[0], d.accent[1], d.accent[2]]);
    d.accent = [
      d.accent[0] * (1 - strength) + color[0] * strength,
      d.accent[1] * (1 - strength) + color[1] * strength,
      d.accent[2] * (1 - strength) + color[2] * strength
    ];
  }
}

export function restoreDistrictAccents(): void {
  for (const d of DISTRICTS) {
    const a = savedAccents.get(d.id);
    if (a) d.accent = a;
  }
  savedAccents.clear();
}

export function applyThemedSky(app: AppBase, color: [number, number, number]): void {
  const c = app.scene.ambientLight ?? new Color(0.2, 0.22, 0.3);
  app.scene.ambientLight = new Color(
    c.r * 0.6 + color[0] * 0.35,
    c.g * 0.6 + color[1] * 0.35,
    c.b * 0.6 + color[2] * 0.35
  );
  app.scene.exposure = 1.05;
}

export function rulerThemeFromHero(hero: HeroSpec, form: HeroForm): {
  color: [number, number, number];
  label: string;
} {
  return { color: form.color, label: hero.codename };
}
