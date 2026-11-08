export type PlayerRole = 'hero' | 'villain';

const KEY = 'flight-nemulator-player-role';

export function getPlayerRole(): PlayerRole {
  const v = localStorage.getItem(KEY);
  return v === 'villain' ? 'villain' : 'hero';
}

export function setPlayerRole(role: PlayerRole): void {
  localStorage.setItem(KEY, role);
}

export function roleLabel(role: PlayerRole): string {
  return role === 'hero' ? 'Hero (save the city)' : 'Villain (wreck & run)';
}
