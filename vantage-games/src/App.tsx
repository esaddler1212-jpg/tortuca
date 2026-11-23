import { useCallback, useEffect, useRef, useState } from 'react';
import { listPlayableGames, type PlayableGame } from './gameLinks';

function launch(game: PlayableGame) {
  window.location.assign(game.href);
}

export default function App() {
  const games = listPlayableGames();
  const [index, setIndex] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  const selected = games[index] ?? games[0];

  const scrollCardIntoView = useCallback((i: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  const setFocus = useCallback(
    (i: number) => {
      if (!games.length) return;
      const next = (i + games.length) % games.length;
      setIndex(next);
      scrollCardIntoView(next);
    },
    [games.length, scrollCardIntoView]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!games.length) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocus(index + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocus(index - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const g = games[index];
        if (g) launch(g);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [games, index, setFocus]);

  if (!games.length) {
    return (
      <div className="launcher-shell">
        <header className="launcher-header">
          <p className="eyebrow">VantageGames</p>
          <h1>Pick a game</h1>
        </header>
        <div className="card empty-card">
          <p className="hint">
            Games are not bundled. Run <code>npm run build:with-console</code> or deploy with the
            default Netlify build.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="launcher-shell">
      <div className="launcher-bg" aria-hidden="true" />
      <header className="launcher-header">
        <p className="eyebrow">VantageGames</p>
        <h1>Pick a game</h1>
        <p className="launcher-sub">Scroll the row · tap or press Enter to play</p>
      </header>

      <div className="title-rail-wrap">
        <div className="title-rail" ref={railRef} role="listbox" aria-label="Choose a game">
          {games.map((g, i) => {
            const isSelected = i === index;
            return (
              <button
                key={g.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`title-card ${g.artClass} ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  setIndex(i);
                  launch(g);
                }}
                onFocus={() => setIndex(i)}
              >
                <span className="title-card-shine" aria-hidden="true" />
                <span className="title-card-name">{g.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <section className="title-detail" aria-live="polite">
          <h2>{selected.title}</h2>
          <p className="hint">{selected.subtitle}</p>
          <button type="button" className="btn btn-primary launch-btn" onClick={() => launch(selected)}>
            Play {selected.title}
          </button>
        </section>
      )}

      <p className="launcher-hint" aria-hidden="true">
        ← → browse · Enter play
      </p>
    </div>
  );
}
