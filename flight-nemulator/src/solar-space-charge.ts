import { Vec3 } from 'playcanvas';

/** Altitude band treated as near-space for Solar Apex charge-up. */
export const SOLAR_SPACE_ALT_M = 950;
const CHARGE_RATE = 0.22;
const DECAY_RATE = 0.35;

let charge = 0;

export function getSolarCharge(): number {
  return charge;
}

export function resetSolarCharge(): void {
  charge = 0;
}

/** Sun-charged when high, moving fast, and not diving underground. */
export function tickSolarSpaceCharge(heroId: string, pos: Vec3, speedKmh: number, dt: number): number {
  if (heroId !== 'solar-apex') {
    charge = Math.max(0, charge - dt * DECAY_RATE);
    return charge;
  }
  if (pos.y >= SOLAR_SPACE_ALT_M && speedKmh >= 180) {
    charge = Math.min(1, charge + dt * CHARGE_RATE * (0.6 + Math.min(1, (pos.y - SOLAR_SPACE_ALT_M) / 1200)));
  } else {
    charge = Math.max(0, charge - dt * DECAY_RATE);
  }
  return charge;
}

/** +80% power at full charge, scales linearly. */
export function solarPowerMultiplier(heroId: string): number {
  if (heroId !== 'solar-apex') return 1;
  return 1 + charge * 0.8;
}

export function solarSmashMultiplier(heroId: string): number {
  if (heroId !== 'solar-apex') return 1;
  return 1 + charge * 0.5;
}

export function isSolarFullyCharged(heroId: string): boolean {
  return heroId === 'solar-apex' && charge >= 0.92;
}
