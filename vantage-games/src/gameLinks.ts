/** Playable games bundled under /console/ (or env overrides). */

function trimSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export type PlayableGame = {
  id: 'city-nights' | 'battleworld';
  title: string;
  subtitle: string;
  href: string;
  artClass: string;
};

function consoleBase(): string {
  const bundled = trimSlash(`${import.meta.env.BASE_URL}console`);
  const override = import.meta.env.VITE_VANTAGE_CONSOLE_URL as string | undefined;
  if (override === '') return '';
  return trimSlash(override ?? bundled);
}

export function listPlayableGames(): PlayableGame[] {
  const base = consoleBase();
  if (!base) return [];

  const city =
    import.meta.env.VITE_CITY_NIGHTS_URL ?? `${base}/city-nights/`;
  const battle =
    import.meta.env.VITE_FLIGHT_NEMULATOR_URL ?? `${base}/flight-nemulator/`;

  return [
    {
      id: 'city-nights',
      title: 'City Nights',
      subtitle: 'Open-world Bay Area night driving',
      href: city.endsWith('/') ? city : `${city}/`,
      artClass: 'art-city-nights'
    },
    {
      id: 'battleworld',
      title: 'Battleworld',
      subtitle: 'Flight Nemulator · heroes on one destructible planet',
      href: battle.endsWith('/') ? battle : `${battle}/`,
      artClass: 'art-battleworld'
    }
  ];
}
