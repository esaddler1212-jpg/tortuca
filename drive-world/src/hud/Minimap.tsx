import type { HudSnapshot } from '../game-bridge';
import { TOKYO_MINIMAP_TITLE } from '../tokyo-ff-cars';
import { BayMap } from './BayMap';

const SIZE = 168;

export function Minimap({ snap }: { snap: HudSnapshot }) {
  const title = snap.inTokyo ? TOKYO_MINIMAP_TITLE : 'City Nights map';
  return (
    <div className="minimap-wrap">
      <div className="minimap-title">{title}</div>
      <BayMap snap={snap} size={SIZE} />
    </div>
  );
}
