import { useEffect, useState } from 'react';

import type { HudSnapshot } from '../game-bridge';
import { requestClaimSafehouse, requestSetHomeSafehouse } from '../game-bridge';
import { DISTRICT_LABELS } from '../landmark-registry';
import {
  dwellingKindLabel,
  homeServiceHint,
  homeServicePoint,
  listSelectableSafehouses,
  resolveHomeSafehouse,
  suggestCustomCondoName
} from '../safehouse-registry';

export function SafehousePanel({ snap }: { snap: HudSnapshot }) {
  const suggested = suggestCustomCondoName(snap.playerX, snap.playerZ);
  const [customName, setCustomName] = useState(suggested);

  useEffect(() => {
    if (snap.mph < 12) setCustomName(suggestCustomCondoName(snap.playerX, snap.playerZ));
  }, [snap.playerX, snap.playerZ, snap.mph]);
  if (!snap.progress || snap.phase !== 'home' || snap.ridingWaymo) return null;

  const progress = snap.progress;
  const home = resolveHomeSafehouse(progress);
  const svc = homeServicePoint(home);
  const choices = listSelectableSafehouses(progress);

  return (
    <details className="safehouse-panel" open={snap.nearGarage}>
      <summary>
        Home: {home.name}
        <span className="dwelling-tag"> · {dwellingKindLabel(home.kind)}</span>
        {snap.atSafehouse && !snap.nearGarage ? ' · nearby' : ''}
      </summary>
      <p className="sync-msg">{homeServiceHint(svc.mode)} · orange dot on map</p>
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
                {h.custom ? ' ★' : ''} · {dwellingKindLabel(h.kind)} — {DISTRICT_LABELS[h.district]}
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
            Claim condo here
          </button>
          <p className="sync-msg">Penthouses are regional unlocks; anywhere else you park becomes a condo garage.</p>
        </div>
      )}
    </details>
  );
}
