import type { AerialMobility } from './aerial-mobility';
import type { HeroForm, HeroSpec } from './hero-roster';

const BAT_JETPACK_LOADOUTS = new Set(['tactical', 'beyond-jet', 'hellbat', 'arkham-lift']);

export function effectiveHeroAerial(spec: HeroSpec, form: HeroForm): AerialMobility {
  if (spec.id === 'shade-knight' && BAT_JETPACK_LOADOUTS.has(form.id)) return 'jetpack';
  return spec.aerial;
}

export function resolveHeroForm(spec: HeroSpec, formId: string): HeroForm {
  const fromForm = spec.forms.find((f) => f.id === formId);
  if (fromForm) return fromForm;

  const suit = spec.suitVariants?.find((s) => s.id === formId);
  if (suit) {
    const base = spec.forms[0] ?? {
      id: suit.id,
      label: suit.label,
      speedMul: 1,
      powerMul: 1,
      color: suit.color
    };
    const heavy = suit.id === 'hulkbuster' || suit.id === 'wm-siege';
    const speed =
      suit.speedMul ??
      (heavy ? 0.82 : suit.id === 'mk50' || suit.id === 'mk85' ? 1.18 : suit.id === 'stealth' ? 1.15 : 1);
    const power =
      suit.powerMul ??
      (heavy || suit.id === 'wm-siege' ? 1.45 : suit.id === 'stealth' ? 0.85 : 1);
    return {
      id: suit.id,
      label: suit.label,
      speedMul: base.speedMul * speed,
      powerMul: base.powerMul * power,
      color: suit.color
    };
  }
  return spec.forms.find((f) => f.id === spec.defaultFormId) ?? spec.forms[0];
}

export function storedFormId(spec: HeroSpec): string {
  return localStorage.getItem(`flight-nemulator-form-${spec.id}`) ?? spec.defaultFormId;
}
