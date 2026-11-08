import type { HeroForm, PowerKind } from './hero-roster';
import { getHero } from './hero-roster';

export const VENOM_PLAYABLE_ID = 'venom-echo';

const STORAGE_KEY = 'flight-nemulator-venom-bonds';
const MAX_BONDS = 8;

export interface VenomBond {
  profileId: string;
  codename: string;
  color: [number, number, number];
  kitPrimary?: PowerKind;
}

function loadBonds(): VenomBond[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VenomBond[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBonds(bonds: VenomBond[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bonds));
}

export function listVenomBonds(): VenomBond[] {
  return loadBonds();
}

export function bondVenomToHero(profileId: string, codename: string): VenomBond | null {
  const hero = getHero(profileId);
  if (!hero) return null;
  const bonds = loadBonds();
  if (bonds.some((b) => b.profileId === profileId)) return bonds.find((b) => b.profileId === profileId) ?? null;
  if (bonds.length >= MAX_BONDS) return null;
  const form = hero.forms[0];
  const entry: VenomBond = {
    profileId,
    codename,
    color: form?.color ?? hero.forms[0]?.color ?? [0.1, 0.12, 0.1],
    kitPrimary: form?.kitPrimary ?? hero.powers[0]
  };
  bonds.push(entry);
  saveBonds(bonds);
  return entry;
}

export function bondToHeroForm(bond: VenomBond): HeroForm {
  return {
    id: `bond-${bond.profileId}`,
    label: `Bonded — ${bond.codename}`,
    suitRole: 'balanced',
    abilities: ['Symbiote mimic', `${bond.codename} echo`],
    kitPrimary: bond.kitPrimary,
    speedMul: 1.04,
    powerMul: 1.1,
    dmgMul: 1.08,
    color: [
      bond.color[0] * 0.35 + 0.06,
      bond.color[1] * 0.35 + 0.08,
      bond.color[2] * 0.35 + 0.06
    ]
  };
}

export function venomEchoForms(baseForms: HeroForm[]): HeroForm[] {
  const bonded = listVenomBonds().map(bondToHeroForm);
  const seen = new Set(baseForms.map((f) => f.id));
  const extra = bonded.filter((f) => !seen.has(f.id));
  return [...baseForms, ...extra];
}

export function venomBondHudLine(): string | null {
  const bonds = loadBonds();
  if (!bonds.length) return null;
  return `Bonded heroes: ${bonds
    .slice(-4)
    .map((b) => b.codename)
    .join(', ')}`;
}
