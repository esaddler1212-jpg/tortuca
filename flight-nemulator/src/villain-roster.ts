/** Homage villain clones — DBZ / Marvel / DC-inspired codenames only. */

export type VillainUniverse = 'dbz' | 'marvel' | 'dc';

export interface VillainCloneSpec {
  id: string;
  codename: string;
  tagline: string;
  universe: VillainUniverse;
  /** Heroes this clone is scripted to hunt */
  rivalHeroIds: string[];
  color: [number, number, number];
  hpMul: number;
  speedMul: number;
  siegeMul: number;
  scale: [number, number, number];
}

export const VILLAIN_CLONES: VillainCloneSpec[] = [
  {
    id: 'emperor-frieze',
    codename: 'Emperor Frieze',
    tagline: 'Orbital death ray siege',
    universe: 'dbz',
    rivalHeroIds: ['ki-wanderer', 'ki-prince'],
    color: [0.92, 0.55, 0.95],
    hpMul: 1.1,
    speedMul: 1.05,
    siegeMul: 1.35,
    scale: [2.6, 3.2, 2.2]
  },
  {
    id: 'dark-saiyan-jackal',
    codename: 'Dark Saiyan Jackal',
    tagline: 'Galick building breaker',
    universe: 'dbz',
    rivalHeroIds: ['ki-prince', 'ki-wanderer'],
    color: [0.22, 0.38, 0.82],
    hpMul: 1.25,
    speedMul: 1.15,
    siegeMul: 1.2,
    scale: [3, 3.8, 2.4]
  },
  {
    id: 'cell-mimic',
    codename: 'Cell Mimic',
    tagline: 'Absorbs block by block',
    universe: 'dbz',
    rivalHeroIds: ['ki-wanderer', 'solar-apex'],
    color: [0.35, 0.72, 0.28],
    hpMul: 1.35,
    speedMul: 0.95,
    siegeMul: 1.5,
    scale: [2.9, 4.2, 2.3]
  },
  {
    id: 'spirit-buu',
    codename: 'Spirit Buu',
    tagline: 'Pink devastation tantrum',
    universe: 'dbz',
    rivalHeroIds: ['ki-wanderer', 'storm-hammer'],
    color: [0.95, 0.45, 0.82],
    hpMul: 1.4,
    speedMul: 0.85,
    siegeMul: 1.55,
    scale: [3.2, 3.5, 2.8]
  },
  {
    id: 'doctor-doom',
    codename: 'Dr. Doom',
    tagline: 'Latverian orbital strike',
    universe: 'marvel',
    rivalHeroIds: ['doctor-doom', 'tin-aviator', 'chrome-overmind', 'storm-hammer'],
    color: [0.45, 0.48, 0.52],
    hpMul: 1.3,
    speedMul: 0.9,
    siegeMul: 1.4,
    scale: [2.8, 3.6, 2.4]
  },
  {
    id: 'magnet-warden',
    codename: 'Magnet Warden',
    tagline: 'Steel skeleton twist',
    universe: 'marvel',
    rivalHeroIds: ['chrome-sage', 'wall-crawler', 'tin-aviator'],
    color: [0.72, 0.12, 0.15],
    hpMul: 1.15,
    speedMul: 1,
    siegeMul: 1.25,
    scale: [2.7, 3.4, 2.2]
  },
  {
    id: 'titan-snap-echo',
    codename: 'Titan Snap Echo',
    tagline: 'Infinity wreckage pulse',
    universe: 'marvel',
    rivalHeroIds: ['tin-aviator', 'solar-apex', 'amazon-vanguard'],
    color: [0.55, 0.22, 0.72],
    hpMul: 1.55,
    speedMul: 0.75,
    siegeMul: 1.6,
    scale: [3.6, 4.4, 2.8]
  },
  {
    id: 'brute-abom',
    codename: 'Brute Abom',
    tagline: 'Gamma smash sprint',
    universe: 'marvel',
    rivalHeroIds: ['red-codriver', 'solar-apex', 'ant-scale'],
    color: [0.28, 0.62, 0.22],
    hpMul: 1.45,
    speedMul: 1.2,
    siegeMul: 1.1,
    scale: [3.4, 4, 2.6]
  },
  {
    id: 'venom-echo',
    codename: 'Venom Echo',
    tagline: 'Symbiote tendril shred',
    universe: 'marvel',
    rivalHeroIds: ['wall-crawler', 'shade-knight'],
    color: [0.08, 0.12, 0.1],
    hpMul: 1.2,
    speedMul: 1.25,
    siegeMul: 1.15,
    scale: [3.1, 3.5, 2.5]
  },
  {
    id: 'laughing-harlequin',
    codename: 'Laughing Harlequin',
    tagline: 'Chaos charge downtown',
    universe: 'dc',
    rivalHeroIds: ['shade-knight', 'wall-crawler'],
    color: [0.78, 0.15, 0.45],
    hpMul: 0.95,
    speedMul: 1.3,
    siegeMul: 1.2,
    scale: [2.5, 3, 2]
  },
  {
    id: 'krypton-eclipse',
    codename: 'Krypton Eclipse',
    tagline: 'Sun-hate ram siege',
    universe: 'dc',
    rivalHeroIds: ['solar-apex'],
    color: [0.12, 0.14, 0.2],
    hpMul: 1.35,
    speedMul: 1.1,
    siegeMul: 1.3,
    scale: [3, 3.8, 2.3]
  },
  {
    id: 'deathstroke-arc',
    codename: 'Deathstroke Arc',
    tagline: 'Contract skyline demo',
    universe: 'dc',
    rivalHeroIds: ['shade-knight', 'bolt-archer', 'wall-crawler'],
    color: [0.82, 0.55, 0.15],
    hpMul: 1.1,
    speedMul: 1.35,
    siegeMul: 1.05,
    scale: [2.8, 3.3, 2.2]
  },
  {
    id: 'night-gargoyle',
    codename: 'Night Gargoyle',
    tagline: 'Gothic stone splitter',
    universe: 'dc',
    rivalHeroIds: ['shade-knight', 'martian-strider'],
    color: [0.18, 0.2, 0.28],
    hpMul: 1.2,
    speedMul: 1.05,
    siegeMul: 1.35,
    scale: [3.2, 3.6, 2.6]
  },
  {
    id: 'doomsday-echo',
    codename: 'Doomsday Echo',
    tagline: 'World engine punch',
    universe: 'dc',
    rivalHeroIds: ['solar-apex', 'amazon-vanguard', 'storm-hammer'],
    color: [0.55, 0.52, 0.48],
    hpMul: 1.6,
    speedMul: 0.7,
    siegeMul: 1.45,
    scale: [3.8, 4.6, 3]
  },
  {
    id: 'black-adam-echo',
    codename: 'Black Adam Echo',
    tagline: 'Thunder coup charge',
    universe: 'dc',
    rivalHeroIds: ['storm-hammer', 'emerald-pilot', 'solar-apex'],
    color: [0.15, 0.12, 0.14],
    hpMul: 1.25,
    speedMul: 1.2,
    siegeMul: 1.25,
    scale: [2.9, 3.7, 2.3]
  }
];

export function getVillainClone(id: string): VillainCloneSpec | undefined {
  return VILLAIN_CLONES.find((v) => v.id === id);
}

export function villainRivalsForHero(heroId: string): string[] {
  return VILLAIN_CLONES.filter((v) => v.rivalHeroIds.includes(heroId)).map((v) => v.codename);
}

/** Pick a villain clone weighted toward the active hero's rivals; wave rotates universes. */
export function pickVillainClone(playerHeroId: string, wave: number, slot: number): VillainCloneSpec {
  const rivals = VILLAIN_CLONES.filter((v) => v.rivalHeroIds.includes(playerHeroId));
  const uniOrder: VillainUniverse[] = ['dbz', 'marvel', 'dc'];
  const preferredUni = uniOrder[(wave + slot) % uniOrder.length]!;
  const pool =
    rivals.length > 0
      ? rivals
      : VILLAIN_CLONES.filter((v) => v.universe === preferredUni).length > 0
        ? VILLAIN_CLONES.filter((v) => v.universe === preferredUni)
        : VILLAIN_CLONES;
  return pool[(wave * 3 + slot) % pool.length]!;
}
