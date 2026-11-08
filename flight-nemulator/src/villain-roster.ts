/** Homage villain clones — DBZ / Marvel / DC-inspired codenames only. */

import type { AerialMobility } from './aerial-mobility';

export type VillainUniverse = 'dbz' | 'marvel' | 'dc';

export interface VillainCloneSpec {
  id: string;
  codename: string;
  tagline: string;
  universe: VillainUniverse;
  aerial: AerialMobility;
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
    aerial: 'ki',
    rivalHeroIds: ['ki-wanderer', 'ki-prince', 'ki-sage', 'time-blade'],
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
    aerial: 'ki',
    rivalHeroIds: ['ki-prince', 'ki-wanderer', 'time-blade', 'hybrid-warden'],
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
    aerial: 'ki',
    rivalHeroIds: ['ki-wanderer', 'hybrid-warden', 'ki-sage'],
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
    aerial: 'ki',
    rivalHeroIds: ['ki-wanderer', 'hybrid-warden', 'ki-sage'],
    color: [0.95, 0.45, 0.82],
    hpMul: 1.4,
    speedMul: 0.85,
    siegeMul: 1.55,
    scale: [3.2, 3.5, 2.8]
  },
  {
    id: 'legend-bruiser',
    codename: 'Legend Bruiser',
    tagline: 'Wrathful omega barrage',
    universe: 'dbz',
    aerial: 'ki',
    rivalHeroIds: ['ki-wanderer', 'ki-prince', 'hybrid-warden'],
    color: [0.18, 0.72, 0.42],
    hpMul: 1.65,
    speedMul: 0.9,
    siegeMul: 1.55,
    scale: [3.8, 4.5, 3]
  },
  {
    id: 'cataclysm-deity',
    codename: 'Cataclysm Deity',
    tagline: 'Hakai orb tap',
    universe: 'dbz',
    aerial: 'ki',
    rivalHeroIds: ['ki-wanderer', 'ki-prince', 'storm-hammer'],
    color: [0.55, 0.45, 0.85],
    hpMul: 1.75,
    speedMul: 1.1,
    siegeMul: 1.7,
    scale: [3.4, 4.2, 2.6]
  },
  {
    id: 'android-phalanx',
    codename: 'Android Phalanx',
    tagline: 'Infinite energy strafe',
    universe: 'dbz',
    aerial: 'ki',
    rivalHeroIds: ['time-blade', 'ki-wanderer', 'velocity-streak'],
    color: [0.15, 0.18, 0.22],
    hpMul: 1.25,
    speedMul: 1.2,
    siegeMul: 1.35,
    scale: [2.8, 3.4, 2.2]
  },
  {
    id: 'doctor-doom',
    codename: 'Dr. Doom',
    tagline: 'Latverian orbital strike',
    universe: 'marvel',
    aerial: 'tech',
    rivalHeroIds: ['tin-aviator', 'chrome-sage', 'storm-hammer', 'comet-surfer'],
    color: [0.45, 0.48, 0.52],
    hpMul: 1.3,
    speedMul: 0.9,
    siegeMul: 1.4,
    scale: [2.8, 3.6, 2.4]
  },
  {
    id: 'chrome-overmind',
    codename: 'Chrome Overmind',
    tagline: 'Drone swarm extinction',
    universe: 'marvel',
    aerial: 'tech',
    rivalHeroIds: ['tin-aviator', 'chrome-sage', 'storm-hammer', 'nova-centurion'],
    color: [0.38, 0.42, 0.48],
    hpMul: 1.4,
    speedMul: 1.05,
    siegeMul: 1.5,
    scale: [3, 3.8, 2.4]
  },
  {
    id: 'magnet-warden',
    codename: 'Magnet Warden',
    tagline: 'Steel skeleton twist',
    universe: 'marvel',
    aerial: 'magnet',
    rivalHeroIds: ['chrome-sage', 'wall-crawler', 'tin-aviator', 'storm-caller', 'phoenix-ember'],
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
    aerial: 'native',
    rivalHeroIds: ['tin-aviator', 'solar-apex', 'amazon-vanguard', 'nova-centurion', 'comet-surfer'],
    color: [0.55, 0.22, 0.72],
    hpMul: 1.55,
    speedMul: 0.75,
    siegeMul: 1.6,
    scale: [3.6, 4.4, 2.8]
  },
  {
    id: 'brute-abom',
    codename: 'Brute Abom',
    tagline: 'Gamma smash sprint — siege jetpack',
    universe: 'marvel',
    aerial: 'jetpack',
    rivalHeroIds: ['red-codriver', 'solar-apex', 'tin-aviator', 'gamma-titan'],
    color: [0.28, 0.62, 0.22],
    hpMul: 1.45,
    speedMul: 1.2,
    siegeMul: 1.1,
    scale: [3.4, 4, 2.6]
  },
  {
    id: 'venom-echo',
    codename: 'Venom Echo',
    tagline: 'Symbiote wing-glide shred',
    universe: 'marvel',
    aerial: 'glide',
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
    tagline: 'Chaos jetpack charge',
    universe: 'dc',
    aerial: 'jetpack',
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
    aerial: 'native',
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
    tagline: 'Contract skyline demo — Ikon rig',
    universe: 'dc',
    aerial: 'jetpack',
    rivalHeroIds: ['shade-knight', 'velocity-streak', 'wall-crawler'],
    color: [0.82, 0.55, 0.15],
    hpMul: 1.1,
    speedMul: 1.35,
    siegeMul: 1.05,
    scale: [2.8, 3.3, 2.2]
  },
  {
    id: 'night-gargoyle',
    codename: 'Night Gargoyle',
    tagline: 'Gothic wing-glide splitter',
    universe: 'dc',
    aerial: 'glide',
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
    tagline: 'World engine punch — drop rig',
    universe: 'dc',
    aerial: 'jetpack',
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
    aerial: 'native',
    rivalHeroIds: [
      'storm-hammer',
      'emerald-pilot',
      'jade-architect',
      'garnet-brawler',
      'spectrum-artist',
      'solar-apex',
      'thunder-zealot'
    ],
    color: [0.15, 0.12, 0.14],
    hpMul: 1.25,
    speedMul: 1.2,
    siegeMul: 1.25,
    scale: [2.9, 3.7, 2.3]
  },
  {
    id: 'goblin-glider',
    codename: 'Goblin Glider',
    tagline: 'Pumpkin bomb strafe',
    universe: 'marvel',
    aerial: 'glide',
    rivalHeroIds: ['wall-crawler', 'tin-aviator', 'flame-jet'],
    color: [0.42, 0.55, 0.18],
    hpMul: 1.05,
    speedMul: 1.25,
    siegeMul: 1.3,
    scale: [2.6, 3.1, 2.1]
  },
  {
    id: 'omega-tyrant',
    codename: 'Omega Tyrant',
    tagline: 'Omega beam siege',
    universe: 'dc',
    aerial: 'native',
    rivalHeroIds: ['solar-apex', 'amazon-vanguard', 'martian-strider', 'comet-surfer'],
    color: [0.22, 0.2, 0.28],
    hpMul: 1.7,
    speedMul: 0.65,
    siegeMul: 1.65,
    scale: [4, 4.8, 3.2]
  },
  {
    id: 'brain-colossus',
    codename: 'Brain Colossus',
    tagline: 'Skull-ship glassing',
    universe: 'dc',
    aerial: 'tech',
    rivalHeroIds: ['chrome-sage', 'tin-aviator', 'solar-apex', 'solar-envoy'],
    color: [0.35, 0.55, 0.72],
    hpMul: 1.35,
    speedMul: 0.95,
    siegeMul: 1.45,
    scale: [3.2, 3.8, 2.5]
  },
  {
    id: 'trickster-prince',
    codename: 'Trickster Prince',
    tagline: 'Illusion feint ram',
    universe: 'marvel',
    aerial: 'native',
    rivalHeroIds: ['storm-hammer', 'martian-strider', 'thunder-zealot'],
    color: [0.15, 0.55, 0.42],
    hpMul: 1.1,
    speedMul: 1.15,
    siegeMul: 1.2,
    scale: [2.7, 3.4, 2.2]
  },
  {
    id: 'sine-warden',
    codename: 'Sine Warden',
    tagline: 'Fear spectrum scourge',
    universe: 'dc',
    aerial: 'ring',
    rivalHeroIds: [
      'emerald-pilot',
      'jade-architect',
      'garnet-brawler',
      'spectrum-artist',
      'solar-envoy'
    ],
    color: [0.92, 0.78, 0.12],
    hpMul: 1.2,
    speedMul: 1.05,
    siegeMul: 1.35,
    scale: [2.8, 3.5, 2.3]
  },
  {
    id: 'steel-wraith',
    codename: 'Steel Wraith',
    tagline: 'Mercury blade shred',
    universe: 'marvel',
    aerial: 'native',
    rivalHeroIds: ['chrome-sage', 'tin-aviator', 'nova-centurion'],
    color: [0.75, 0.78, 0.82],
    hpMul: 1.15,
    speedMul: 1.3,
    siegeMul: 1.1,
    scale: [2.6, 3.2, 2]
  },
  {
    id: 'mirror-streak',
    codename: 'Mirror Streak',
    tagline: 'Negative speed-force scourge',
    universe: 'dc',
    aerial: 'native',
    rivalHeroIds: ['velocity-streak'],
    color: [0.72, 0.08, 0.12],
    hpMul: 1.15,
    speedMul: 1.45,
    siegeMul: 1.15,
    scale: [2.7, 3.2, 2.1]
  },
  {
    id: 'bizarro-eclipse',
    codename: 'Bizarro Eclipse',
    tagline: 'Inverted sun-hate fumble siege',
    universe: 'dc',
    aerial: 'native',
    rivalHeroIds: ['solar-apex', 'solar-envoy'],
    color: [0.82, 0.78, 0.55],
    hpMul: 1.3,
    speedMul: 0.85,
    siegeMul: 1.35,
    scale: [3.1, 3.9, 2.4]
  },
  {
    id: 'harbinger-titan',
    codename: 'Harbinger Titan',
    tagline: 'World-Devourer skim',
    universe: 'marvel',
    aerial: 'native',
    rivalHeroIds: ['comet-surfer', 'nova-centurion', 'solar-apex', 'phoenix-ember', 'golden-sentry'],
    color: [0.68, 0.42, 0.22],
    hpMul: 1.85,
    speedMul: 0.6,
    siegeMul: 1.75,
    scale: [4.2, 5, 3.4]
  },
  {
    id: 'void-colossus',
    codename: 'Void Colossus',
    tagline: 'Gray stillness crushing glide',
    universe: 'dbz',
    aerial: 'ki',
    rivalHeroIds: ['ki-wanderer', 'ki-prince', 'hybrid-warden', 'legend-bruiser'],
    color: [0.62, 0.65, 0.68],
    hpMul: 1.8,
    speedMul: 0.95,
    siegeMul: 1.6,
    scale: [3.6, 4.4, 2.8]
  },
  {
    id: 'angel-attendant',
    codename: 'Angel Attendant',
    tagline: 'Angel ki lesson strike',
    universe: 'dbz',
    aerial: 'ki',
    rivalHeroIds: ['ki-wanderer', 'ki-prince', 'cataclysm-deity'],
    color: [0.95, 0.95, 0.98],
    hpMul: 1.5,
    speedMul: 1.35,
    siegeMul: 1.4,
    scale: [3, 3.6, 2.3]
  },
  {
    id: 'cinder-phoenix',
    codename: 'Cinder Phoenix',
    tagline: 'Corrupted cosmic flare siege',
    universe: 'marvel',
    aerial: 'native',
    rivalHeroIds: ['phoenix-ember', 'storm-caller', 'chrome-sage'],
    color: [0.95, 0.22, 0.08],
    hpMul: 1.45,
    speedMul: 1.1,
    siegeMul: 1.5,
    scale: [3.2, 4, 2.5]
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
