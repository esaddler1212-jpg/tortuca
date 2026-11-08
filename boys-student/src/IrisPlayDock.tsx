import { resolveBoysGameLinks, gamesReady } from './gameLinks';

type Props = {
  studentName: string;
};

export function IrisPlayDock({ studentName }: Props) {
  const links = resolveBoysGameLinks();
  const first = studentName.split(/\s+/)[0] ?? studentName;

  if (!gamesReady()) {
    return (
      <div className="card iris-dock">
        <p className="eyebrow">Iris · play</p>
        <h2>Games loading soon</h2>
        <p className="hint">
          Your mentor can wire the Tortuca Console URL in Netlify. Locally, run{' '}
          <code>npm run build:with-console</code> in <code>boys-student</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="iris-dock">
      <div className="iris-panel card">
        <div className="iris-orb" aria-hidden="true">
          <span className="iris-orb-core" />
        </div>
        <div className="iris-copy">
          <p className="eyebrow">Iris · with BOYS</p>
          <h2>Hey {first} — ready to play with purpose?</h2>
          <p className="hint">
            I&apos;m Iris, your Tortuca wingmate. <strong>Battleworld</strong> is already in Flight
            Nemulator — one planet, Marvel · DC · DBZ arcs. <strong>City Nights</strong> is night
            driving across the Bay. Start from the console or jump straight in.
          </p>
          <p className="iris-chant">
            Who are we? <strong>BOYS!</strong> How do we move? <strong>With purpose!</strong>
          </p>
        </div>
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
        Games open in this tab. Use <strong>◯ BOYS</strong> in the corner of the console to come back to
        your lesson.
      </p>
    </div>
  );
}
