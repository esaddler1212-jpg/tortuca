/** Tortuca Console + games (bundled under /console/ or overridden via env). */

function trimSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export type BoysGameLink = {
  id: 'console' | 'city-nights' | 'battleworld';
  title: string;
  subtitle: string;
  href: string;
};

export function resolveBoysGameLinks(): BoysGameLink[] {
  const bundled = trimSlash(`${import.meta.env.BASE_URL}console`);
  const consoleOverride = import.meta.env.VITE_BOYS_CONSOLE_URL as string | undefined;
  const consoleBase =
    consoleOverride === ''
      ? ''
      : trimSlash(consoleOverride ?? bundled);
  const cityUrl =
    import.meta.env.VITE_CITY_NIGHTS_URL ??
    (consoleBase ? `${consoleBase}/city-nights/` : '');
  const battleUrl =
    import.meta.env.VITE_FLIGHT_NEMULATOR_URL ??
    (consoleBase ? `${consoleBase}/flight-nemulator/` : '');

  const links: BoysGameLink[] = [];
  if (consoleBase) {
    links.push({
      id: 'console',
      title: 'Tortuca Console',
      subtitle: 'PlayStation-style home — pick a game',
      href: `${consoleBase}/`
    });
  }
  if (cityUrl) {
    links.push({
      id: 'city-nights',
      title: 'City Nights',
      subtitle: 'Bay Area night driving open world',
      href: cityUrl.endsWith('/') ? cityUrl : `${cityUrl}/`
    });
  }
  if (battleUrl) {
    links.push({
      id: 'battleworld',
      title: 'Battleworld',
      subtitle: 'Flight Nemulator — fly homage heroes on one planet',
      href: battleUrl.endsWith('/') ? battleUrl : `${battleUrl}/`
    });
  }
  return links;
}

export function gamesReady(): boolean {
  return resolveBoysGameLinks().length > 0;
}
