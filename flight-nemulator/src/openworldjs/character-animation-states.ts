/** Animation state ids (OpenWorldJS states.js — ISC). */
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
