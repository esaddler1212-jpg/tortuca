import { PAIR_BOSS_WAVE } from './hero-pair-boss';

export type CombatJuicePhase = 'calm' | 'rising' | 'finale' | 'pair-duel';

export function combatJuicePhase(
  wave: number,
  pairBossActive: boolean,
  pairIncoming: boolean
): CombatJuicePhase {
  if (pairBossActive) return 'pair-duel';
  if (pairIncoming || wave >= PAIR_BOSS_WAVE) return 'finale';
  if (wave >= PAIR_BOSS_WAVE - 2) return 'rising';
  return 'calm';
}

export function waveCombatHudChip(phase: CombatJuicePhase, wave: number): string | null {
  switch (phase) {
    case 'pair-duel':
      return `WAVE ${PAIR_BOSS_WAVE} · PAIR DUEL`;
    case 'finale':
      return wave >= PAIR_BOSS_WAVE ? `WAVE ${wave} · FINALE` : `WAVE ${wave} → ${PAIR_BOSS_WAVE}`;
    case 'rising':
      return `WAVE ${wave} · heating up`;
    default:
      return null;
  }
}

/** Subtle rumble while finale ramps (per frame). */
export function combatJuiceShakeTick(phase: CombatJuicePhase, dt: number): number {
  if (phase === 'pair-duel') return dt * 0.22;
  if (phase === 'finale') return dt * 0.14;
  if (phase === 'rising') return dt * 0.06;
  return 0;
}
