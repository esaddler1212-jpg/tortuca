import { createRoot } from 'react-dom/client';

import { HudApp } from './HudApp';
import '../hud/hud.css';

export function mountReactHud(): void {
  const node = document.getElementById('react-hud');
  if (!node) return;
  createRoot(node).render(<HudApp />);
}
