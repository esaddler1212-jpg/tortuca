import type { AerialMobility } from './aerial-mobility';
import type { HeroForm, HeroSpec } from './hero-roster';

export function effectiveHeroAerial(spec: HeroSpec, form: HeroForm): AerialMobility {
  if (spec.id === 'shade-knight' && form.id === 'tactical') return 'jetpack';
  return spec.aerial;
}

export function resolveHeroForm(spec: HeroSpec, formId: string): HeroForm {
  const fromForm = spec.forms.find((f) => f.id === formId);
  if (fromForm) return fromForm;

  const suit = spec.suitVariants?.find((s) => s.id === formId);
  if (suit) {
    const base = spec.forms[0];
    const heavy = suit.id === 'hulkbuster';
    return {
      id: suit.id,
      label: suit.label,
      speedMul: base.speedMul * (heavy ? 0.82 : suit.id === 'mk50' ? 1.18 : 1),
      powerMul: base.powerMul * (heavy ? 1.45 : 1),
      color: suit.color
    };
  }
  return spec.forms.find((f) => f.id === spec.defaultFormId) ?? spec.forms[0];
}

export function storedFormId(spec: HeroSpec): string {
  return localStorage.getItem(`flight-nemulator-form-${spec.id}`) ?? spec.defaultFormId;
}
