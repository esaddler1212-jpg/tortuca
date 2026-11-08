export type WantedState = {
  stars: number;
  heat: number;
};

const DESTRUCTION_THRESHOLD = 2_000_000;

export function createWanted(): WantedState {
  return { stars: 0, heat: 0 };
}

export function addDestructionHeat(state: WantedState, costUsd: number, dt: number): WantedState {
  state.heat += costUsd / 500_000;
  if (costUsd > 0) {
    state.heat += 0.15;
  }
  state.heat = Math.max(0, state.heat - dt * 0.08);
  if (state.heat > 6) state.stars = 5;
  else if (state.heat > 4.5) state.stars = 4;
  else if (state.heat > 3) state.stars = 3;
  else if (state.heat > 1.8) state.stars = 2;
  else if (state.heat > 0.8) state.stars = 1;
  else state.stars = 0;
  return state;
}

export function isCityAlert(state: WantedState): boolean {
  return state.heat > DESTRUCTION_THRESHOLD / 1_000_000;
}
