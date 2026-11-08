export type GameTile = {
  id: string;
  title: string;
  tagline: string;
  href: string;
  /** CSS class on art panel for gradient cover */
  artClass: string;
  lastPlayedKey: string;
};

export const GAMES: GameTile[] = [
  {
    id: 'city-nights',
    title: 'City Nights',
    tagline: 'Bay Area night driving · Waymo to safehouse · landmarks & taco trucks',
    href: 'city-nights/',
    artClass: 'art-city-nights',
    lastPlayedKey: 'tortuca-console:last-city-nights'
  },
  {
    id: 'flight-nemulator',
    title: 'Battleworld',
    tagline: 'Flight Nemulator — homage heroes, destructible planet, arc lattice',
    href: 'flight-nemulator/',
    artClass: 'art-flight-nemulator',
    lastPlayedKey: 'tortuca-console:last-flight-nemulator'
  }
];
