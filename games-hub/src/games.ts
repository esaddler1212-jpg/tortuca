export type GameTile = {
  id: string;
  title: string;
  tagline: string;
  /** Couch / phone one-liner — first goal */
  firstGoal: string;
  controls: string;
  href: string;
  /** CSS class on art panel for gradient cover */
  artClass: string;
  lastPlayedKey: string;
};

export const GAMES: GameTile[] = [
  {
    id: 'city-nights',
    title: 'City Nights',
    tagline: 'Bay night drive · explore + street loops',
    firstGoal: 'Taco + landmark → open the Bay',
    controls: 'Phone landscape · RT gas · map pin',
    href: 'city-nights/',
    artClass: 'art-city-nights',
    lastPlayedKey: 'tortuca-console:last-city-nights'
  },
  {
    id: 'flight-nemulator',
    title: 'Battleworld',
    tagline: 'Fly the homage globe · cities · territories',
    firstGoal: 'Hold W · fly to home H on minimap',
    controls: 'W thrust · Shift boost · F fire',
    href: 'flight-nemulator/',
    artClass: 'art-flight-nemulator',
    lastPlayedKey: 'tortuca-console:last-flight-nemulator'
  }
];
