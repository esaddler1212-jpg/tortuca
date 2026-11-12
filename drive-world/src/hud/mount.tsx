import { createRoot } from 'react-dom/client';

import { HudApp } from './HudApp';
import '../hud/hud.css';

export function mountReactHud(): void {
  const node = document.getElementById('react-hud');
  if (!node) return;
  document.body.classList.add('city-nights-shell');
  createRoot(node).render(<HudApp />);
}
