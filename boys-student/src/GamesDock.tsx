import { resolveBoysGameLinks, gamesReady } from './gameLinks';

export function GamesDock() {
  const links = resolveBoysGameLinks();

  if (!gamesReady()) {
    return (
      <div className="card games-dock">
        <h2>Games</h2>
        <p className="hint">
          Games are not bundled yet. Run <code>npm run build:with-console</code> locally, or redeploy
          the BOYS Netlify site with the default build command.
        </p>
      </div>
    );
  }

  return (
    <div className="games-dock">
      <div className="card games-intro">
        <h2>Games</h2>
        <p className="hint">
          <strong>City Nights</strong> — Bay Area night driving. <strong>Battleworld</strong> — Flight
          Nemulator (Marvel · DC · DBZ on one planet). Or open the console to pick from the home
          screen.
        </p>
      </div>

      <div className="game-grid" role="list">
        {links.map((g) => (
          <a
            key={g.id}
            className={`game-tile game-tile--${g.id}`}
            href={g.href}
            role="listitem"
          >
            <span className="game-tile-title">{g.title}</span>
            <span className="game-tile-sub">{g.subtitle}</span>
            <span className="game-tile-cta">Play →</span>
          </a>
        ))}
      </div>

      <p className="hint game-footnote">
        Use <strong>◯ BOYS</strong> in the console corner to return here.
      </p>
    </div>
  );
}
