/** Informal “mutates from” labels — fan tribute only, not affiliated with rights holders. */

export type MutationUniverse = 'marvel' | 'dc' | 'dbz' | 'original';

export interface MutationMeta {
  mutatesFrom: string;
  universe: MutationUniverse;
}

export const HERO_MUTATIONS: Record<string, MutationMeta> = {
  'solar-apex': { mutatesFrom: 'Superman', universe: 'dc' },
  'emerald-pilot': { mutatesFrom: 'Green Lantern (Hal Jordan)', universe: 'dc' },
  'jade-architect': { mutatesFrom: 'Green Lantern (John Stewart)', universe: 'dc' },
  'garnet-brawler': { mutatesFrom: 'Green Lantern (Guy Gardner)', universe: 'dc' },
  'spectrum-artist': { mutatesFrom: 'Green Lantern (Kyle Rayner)', universe: 'dc' },
  'tin-aviator': { mutatesFrom: 'Iron Man', universe: 'marvel' },
  'chrome-sage': { mutatesFrom: 'Vision', universe: 'marvel' },
  'storm-hammer': { mutatesFrom: 'Thor', universe: 'marvel' },
  'ki-wanderer': { mutatesFrom: 'Goku', universe: 'dbz' },
  'ki-prince': { mutatesFrom: 'Vegeta', universe: 'dbz' },
  'ki-sage': { mutatesFrom: 'Piccolo', universe: 'dbz' },
  'time-blade': { mutatesFrom: 'Future Trunks', universe: 'dbz' },
  'hybrid-warden': { mutatesFrom: 'Gohan', universe: 'dbz' },
  'wall-crawler': { mutatesFrom: 'Spider-Man', universe: 'marvel' },
  'red-codriver': { mutatesFrom: 'War Machine', universe: 'marvel' },
  'martian-strider': { mutatesFrom: 'Martian Manhunter', universe: 'dc' },
  'shade-knight': { mutatesFrom: 'Batman', universe: 'dc' },
  'amazon-vanguard': { mutatesFrom: 'Wonder Woman', universe: 'dc' },
  'velocity-streak': { mutatesFrom: 'The Flash', universe: 'dc' },
  'comet-surfer': { mutatesFrom: 'Silver Surfer', universe: 'marvel' },
  'nova-centurion': { mutatesFrom: 'Nova', universe: 'marvel' },
  'solar-envoy': { mutatesFrom: 'Supergirl', universe: 'dc' },
  'gamma-titan': { mutatesFrom: 'Hulk', universe: 'marvel' },
  'flame-jet': { mutatesFrom: 'Human Torch', universe: 'marvel' },
  'wing-captain': { mutatesFrom: 'Falcon', universe: 'marvel' },
  'thunder-zealot': { mutatesFrom: 'Shazam', universe: 'dc' },
  'storm-caller': { mutatesFrom: 'Storm', universe: 'marvel' },
  'sorcerer-apex': { mutatesFrom: 'Doctor Strange', universe: 'marvel' },
  'sky-tyrant': { mutatesFrom: 'Hawkman', universe: 'dc' },
  'phoenix-ember': { mutatesFrom: 'Jean Grey / Phoenix', universe: 'marvel' },
  'wing-archon': { mutatesFrom: 'Angel / Archangel', universe: 'marvel' },
  'golden-sentry': { mutatesFrom: 'Sentry', universe: 'marvel' },
  'magnet-sovereign': { mutatesFrom: 'Magneto', universe: 'marvel' }
};

export const VILLAIN_MUTATIONS: Record<string, MutationMeta> = {
  'emperor-frieze': { mutatesFrom: 'Frieza', universe: 'dbz' },
  'dark-saiyan-jackal': { mutatesFrom: 'Saiyan antagonist (e.g. Turles / Raditz archetype)', universe: 'dbz' },
  'cell-mimic': { mutatesFrom: 'Cell', universe: 'dbz' },
  'spirit-buu': { mutatesFrom: 'Majin Buu', universe: 'dbz' },
  'legend-bruiser': { mutatesFrom: 'Broly', universe: 'dbz' },
  'cataclysm-deity': { mutatesFrom: 'Beerus', universe: 'dbz' },
  'android-phalanx': { mutatesFrom: 'Android 17 / 18 archetype', universe: 'dbz' },
  'void-colossus': { mutatesFrom: 'Jiren', universe: 'dbz' },
  'angel-attendant': { mutatesFrom: 'Whis', universe: 'dbz' },
  'doctor-doom': { mutatesFrom: 'Doctor Doom', universe: 'marvel' },
  'chrome-overmind': { mutatesFrom: 'Ultron', universe: 'marvel' },
  'magnet-warden': { mutatesFrom: 'Magneto', universe: 'marvel' },
  'titan-snap-echo': { mutatesFrom: 'Thanos', universe: 'marvel' },
  'brute-abom': { mutatesFrom: 'Abomination', universe: 'marvel' },
  'venom-echo': { mutatesFrom: 'Venom', universe: 'marvel' },
  'cinder-phoenix': { mutatesFrom: 'Dark Phoenix', universe: 'marvel' },
  'laughing-harlequin': { mutatesFrom: 'Joker & Harley Quinn', universe: 'dc' },
  'krypton-eclipse': { mutatesFrom: 'General Zod', universe: 'dc' },
  'mirror-streak': { mutatesFrom: 'Reverse-Flash', universe: 'dc' },
  'bizarro-eclipse': { mutatesFrom: 'Bizarro', universe: 'dc' },
  'deathstroke-arc': { mutatesFrom: 'Deathstroke', universe: 'dc' },
  'night-gargoyle': { mutatesFrom: 'Man-Bat', universe: 'dc' },
  'doomsday-echo': { mutatesFrom: 'Doomsday', universe: 'dc' },
  'black-adam-echo': { mutatesFrom: 'Black Adam', universe: 'dc' },
  'goblin-glider': { mutatesFrom: 'Green Goblin', universe: 'marvel' },
  'omega-tyrant': { mutatesFrom: 'Darkseid', universe: 'dc' },
  'brain-colossus': { mutatesFrom: 'Brainiac', universe: 'dc' },
  'trickster-prince': { mutatesFrom: 'Loki', universe: 'marvel' },
  'sine-warden': { mutatesFrom: 'Sinestro', universe: 'dc' },
  'steel-wraith': { mutatesFrom: 'Liquid-metal assassin (T-1000 archetype)', universe: 'marvel' },
  'harbinger-titan': { mutatesFrom: 'Galactus', universe: 'marvel' }
};
