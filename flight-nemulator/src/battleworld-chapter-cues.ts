import type { ArcBeat } from './arc-progress';
import type { PlayerRole } from './player-role';
import { BATTLEWORLD_CHAPTER_STEPS, type BattleworldChapterId } from './battleworld-chapters';
import { dialogueChapterClear } from './battleworld-dialogue';
import { queueDialogue } from './cutscene-queue';

const BEAT_TO_CHAPTER: Partial<Record<ArcBeat, BattleworldChapterId>> = {
  'territory-clear': 'territory',
  'home-mark': 'territory',
  'stone-linked': 'stones'
};

/** Queue a bw-d08 dialogue beat when a chapter-opening arc beat lands for the first time. */
export function queueChapterClearDialogue(
  beat: ArcBeat,
  heroCodename: string,
  role: PlayerRole
): void {
  const chapterId = BEAT_TO_CHAPTER[beat];
  if (!chapterId) return;
  const step = BATTLEWORLD_CHAPTER_STEPS.find((s) => s.id === chapterId);
  if (!step) return;
  queueDialogue(dialogueChapterClear(step.label, step.hint, heroCodename, role));
}