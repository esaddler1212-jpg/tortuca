/**
 * Character animation state ids — from OpenWorldJS js/game/utils/states.js (ISC).
 * For future GLB / Mixamo blending in City Nights on-foot mode.
 */
export const CharacterAnimationState = {
  IDLE: 'Idle',
  DEAD: 'Dead',
  WALK: 'Walk',
  RUN: 'Run',
  JUMP: 'Jump',
  FALL_IDLE: 'FallIdle',
  CROUCH_IDLE: 'CrouchIdle',
  CROUCH_WALK: 'CrouchWalk',
  SLIDE: 'Slide'
} as const;

export type CharacterAnimationStateId =
  (typeof CharacterAnimationState)[keyof typeof CharacterAnimationState];
