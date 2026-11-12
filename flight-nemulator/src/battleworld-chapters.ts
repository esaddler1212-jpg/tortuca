import type { PlayerRole } from './player-role';
import { arcBeatsForHero, hasArcBeat, hasDistrictSignatureBeat } from './arc-progress';

export type BattleworldChapterId =
  | 'intro'
  | 'territory'
  | 'stones'
  | 'home-turf'
  | 'pair-or-runway'
  | 'fate';

export type BattleworldChapterStep = {
  id: BattleworldChapterId;
  label: string;
  hint: string;
};

/** Opening ladder — game-finish Day 3 (Chapters 1–3 chain). */
export const BATTLEWORLD_CHAPTER_CHAIN_1_3: BattleworldChapterId[] = ['intro', 'territory', 'stones'];

export const BATTLEWORLD_CHAPTER_STEPS: BattleworldChapterStep[] = [
  {
    id: 'intro',
    label: 'Welcome to Battleworld',
    hint: 'Pick a legend — rivals already know your district'
  },
  {
    id: 'territory',
    label: 'Hold the lattice',
    hint: 'Hero: clear takeovers · Villain: raze or hold districts'
  },
  {
    id: 'stones',
    label: 'Infinity hunt',
    hint: 'H at stone sites — race Thanos, Loki, and Ultron homages'
  },
  {
    id: 'home-turf',
    label: 'Home turf oath',
    hint: 'H at your home district — corps, ki squad, or personal mark'
  },
  {
    id: 'pair-or-runway',
    label: 'Finale runway',
    hint: 'Hero wave-10 pair rival · Villain apex lattice'
  },
  {
    id: 'fate',
    label: 'World fate',
    hint: 'Save above 52% integrity or remake the dying planet'
  }
];

export function syncBattleworldChapters(
  heroId: string,
  role: PlayerRole,
  villainOnly: boolean
): { step: BattleworldChapterStep; done: boolean }[] {
  const beats = arcBeatsForHero(heroId);
  const homeOk = hasDistrictSignatureBeat(heroId);

  return BATTLEWORLD_CHAPTER_STEPS.map((step) => {
    let done = false;
    switch (step.id) {
      case 'intro':
        done = true;
        break;
      case 'territory':
        done =
          role === 'villain'
            ? beats.has('home-mark') || hasArcBeat(heroId, 'villain-apex')
            : beats.has('territory-clear');
        break;
      case 'stones':
        done = beats.has('stone-linked') || beats.has('hunt-ascended');
        break;
      case 'home-turf':
        done = homeOk;
        break;
      case 'pair-or-runway':
        done = villainOnly
          ? hasArcBeat(heroId, 'villain-apex')
          : beats.has('pair-down');
        break;
      case 'fate':
        done = beats.has('world-saved') || beats.has('hunt-ascended');
        break;
      default:
        done = false;
    }
    return { step, done };
  });
}

export function nextBattleworldChapterHint(
  heroId: string,
  role: PlayerRole,
  villainOnly: boolean
): string | null {
  const rows = syncBattleworldChapters(heroId, role, villainOnly);
  const next = rows.find((r) => !r.done);
  if (!next) return 'Battleworld chapters complete — roam or raise world generation';
  return `Chapter — ${next.step.label}: ${next.step.hint}`;
}

export function battleworldChapterChip(
  heroId: string,
  role: PlayerRole,
  villainOnly: boolean
): string {
  const rows = syncBattleworldChapters(heroId, role, villainOnly);
  return rows.map((r) => (r.done ? '✓' : '○')).join('');
}

export function syncBattleworldChapterChain1_3(
  heroId: string,
  role: PlayerRole,
  villainOnly: boolean
): { chapter: number; step: BattleworldChapterStep; done: boolean }[] {
  const rows = syncBattleworldChapters(heroId, role, villainOnly);
  return BATTLEWORLD_CHAPTER_CHAIN_1_3.map((id, i) => {
    const row = rows.find((r) => r.step.id === id);
    return {
      chapter: i + 1,
      step: row?.step ?? BATTLEWORLD_CHAPTER_STEPS.find((s) => s.id === id)!,
      done: row?.done ?? false
    };
  });
}

export function battleworldOpeningChapterChip(
  heroId: string,
  role: PlayerRole,
  villainOnly: boolean
): string {
  return syncBattleworldChapterChain1_3(heroId, role, villainOnly)
    .map((r) => `${r.chapter}${r.done ? '✓' : '○'}`)
    .join(' · ');
}

export function battleworldOpeningChapterObjective(
  heroId: string,
  role: PlayerRole,
  villainOnly: boolean
): string {
  const chain = syncBattleworldChapterChain1_3(heroId, role, villainOnly);
  const active = chain.find((r) => !r.done);
  if (!active) return 'Chapters 1–3 complete — push toward home turf';
  return `Ch.${active.chapter} ${active.step.label} — ${active.step.hint}`;
}
