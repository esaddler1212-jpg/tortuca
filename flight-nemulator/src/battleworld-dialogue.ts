import type { PlayerRole } from './player-role';
import type { DialogueLine } from './cutscene-queue';
import { pairVillainCodename } from './hero-pair-boss';
import { getVillainClone } from './villain-roster';

function line(
  id: string,
  speaker: string,
  text: string,
  side: DialogueLine['side']
): DialogueLine {
  return { id, speaker, text, side };
}

export function dialogueIntro(heroCodename: string, role: PlayerRole): DialogueLine[] {
  const roleLine =
    role === 'villain'
      ? 'Hold districts or break them — the lattice remembers every raze.'
      : 'Clear takeovers, chase the stone hunt, then face your pair rival at wave ten.';
  return [
    line('intro-narr', 'Battleworld', `${heroCodename} lifts off. Rivals already know your district.`, 'narrator'),
    line('intro-role', heroCodename, roleLine, 'hero')
  ];
}

export function dialoguePairIncoming(heroCodename: string, foeCodename: string): DialogueLine[] {
  return [
    line('pair-in-narr', 'Lattice', `Wave ten signature — ${foeCodename} is vectoring in.`, 'narrator'),
    line('pair-in-hero', heroCodename, 'No more warm-up waves. This is the finisher runway.', 'hero')
  ];
}

export function dialoguePairEncounter(heroCodename: string, foeCodename: string): DialogueLine[] {
  return [
    line('pair-meet-foe', foeCodename, 'Finally. One sky, one throne.', 'foe'),
    line('pair-meet-hero', heroCodename, 'You picked the wrong district to siege.', 'hero')
  ];
}

export function dialoguePairVictory(heroCodename: string, foeCodename: string): DialogueLine[] {
  return [
    line('pair-win-foe', foeCodename, 'Next timeline… I still find you.', 'foe'),
    line('pair-win-hero', heroCodename, 'Pair rival down. Lattice beat recorded.', 'hero'),
    line('pair-win-narr', 'Battleworld', 'Auto-save stored — progress safe if you bail.', 'narrator')
  ];
}

export function dialogueVillainApexEncounter(heroCodename: string, foeCodename: string): DialogueLine[] {
  return [
    line('apex-narr', 'Lattice', `Hero interceptors converge — lead: ${foeCodename}.`, 'narrator'),
    line('apex-villain', heroCodename, 'Come test the runway. I am the apex.', 'hero')
  ];
}

export function dialogueFoeDefeat(
  heroCodename: string,
  role: PlayerRole,
  profileId: string,
  foeCodename: string
): DialogueLine[] {
  const clone = getVillainClone(profileId);
  if (role === 'hero' && clone) {
    return [
      line(`defeat-foe-${profileId}`, foeCodename, clone.tagline, 'foe'),
      line(`defeat-hero-${profileId}`, heroCodename, `${foeCodename} down — city pressure eases.`, 'hero')
    ];
  }
  if (role === 'villain') {
    return [
      line('defeat-resp', foeCodename, 'Responder offline…', 'foe'),
      line('defeat-villain', heroCodename, 'Another hero off the board.', 'hero')
    ];
  }
  return [
    line('defeat-gen', foeCodename, 'Raider splintered.', 'foe'),
    line('defeat-gen-hero', heroCodename, 'Keep the sky clear.', 'hero')
  ];
}

export function dialogueSafeHouse(heroCodename: string, houseLabel: string): DialogueLine[] {
  return [
    line('safe-narr', 'Safe house', `${houseLabel} — shields steady.`, 'narrator'),
    line('safe-hero', heroCodename, 'Quick breather. Lattice still climbing.', 'hero')
  ];
}

export function pairFoeNameForHero(heroId: string): string {
  return pairVillainCodename(heroId);
}
