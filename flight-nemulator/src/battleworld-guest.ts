import { tortucaSessionId } from './tortuca-auth';

/** Skydex-style guest play — local flight works; cloud lattice & room credit need Tortuca session. */
export function isBattleworldGuest(): boolean {
  return !tortucaSessionId();
}

export function guestHudLine(): string | null {
  if (!isBattleworldGuest()) return null;
  return 'Guest flight — autosave stays on this device. Sign in on Tortuca to sync lattice & room goal.';
}

export function cloudFeaturesAvailable(): boolean {
  return !isBattleworldGuest();
}