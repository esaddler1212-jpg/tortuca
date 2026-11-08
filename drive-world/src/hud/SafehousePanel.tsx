import { useState } from 'react';

import type { HudSnapshot } from '../game-bridge';
import { requestClaimSafehouse, requestSetHomeSafehouse } from '../game-bridge';
import { DISTRICT_LABELS } from '../landmark-registry';
import { listSelectableSafehouses, resolveHomeSafehouse } from '../safehouse-registry';

export function SafehousePanel({ snap }: { snap: HudSnapshot }) {
  const [customName, setCustomName] = useState('My pull-off');
  if (!snap.progress || snap.phase !== 'home' || snap.ridingWaymo) return null;

  const progress = snap.progress;
  const home = resolveHomeSafehouse(progress);
  const choices = listSelectableSafehouses(progress);

  return (
    <details className="safehouse-panel" open={snap.nearGarage}>
      <summary>
        Home: {home.name}
        {snap.atSafehouse && !snap.nearGarage ? ' · nearby' : ''}
      </summary>
      {choices.length > 0 ? (
        <ul className="safehouse-list">
          {choices.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className={`safehouse-pick ${progress.homeSafehouseId === h.id ? 'active' : ''}`}
                onClick={() => requestSetHomeSafehouse(h.id)}
              >
                {h.name}
                {h.custom ? ' ★' : ''} — {DISTRICT_LABELS[h.district]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {snap.mph < 12 && snap.phase === 'home' && (
        <div className="safehouse-claim">
          <label className="slider-row">
            Custom name
            <input
              type="text"
              maxLength={32}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </label>
          <button type="button" className="sync-btn" onClick={() => requestClaimSafehouse(customName)}>
            Claim this spot as safehouse
          </button>
          <p className="sync-msg">Saves where you are parked — becomes home + garage.</p>
        </div>
      )}
    </details>
  );
}
