import { createRoot } from 'react-dom/client';
import { HudApp } from './HudApp';

export function mountHud(): void {
  const el = document.getElementById('react-hud');
  if (!el) return;
  createRoot(el).render(<HudApp />);
}
