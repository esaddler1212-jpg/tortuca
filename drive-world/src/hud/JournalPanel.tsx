import type { HudSnapshot } from '../game-bridge';
import { CRUISE_VISTAS } from '../cruise-vistas';
import { journalLines } from '../cruise-journal';

export function JournalPanel({ snap }: { snap: HudSnapshot }) {
  if (!snap.progress || snap.photoMode) return null;
  const lines = journalLines(snap.progress);
  const vistas = snap.progress.visitedVistaIds.length;
  return (
    <details className="journal-panel">
      <summary>
        Cruise journal · vistas {vistas}/{CRUISE_VISTAS.length}
      </summary>
      <ul>
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </details>
  );
}
