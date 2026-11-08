import { unlockAudio } from './game-audio';
import { unlockMusic } from './game-music';
import { isIOS, isTouchPrimary } from './mobile-platform';

function dismissTapStart(): void {
  const el = document.getElementById('tap-start');
  if (!el) return;
  el.classList.add('tap-start--gone');
  window.setTimeout(() => el.remove(), 400);
}

function onFirstGesture(): void {
  unlockAudio();
  void unlockMusic();
  dismissTapStart();
}

/** Safari/iOS: block scroll zoom on game surface, resume audio after tab focus. */
export function installMobileShell(): void {
  if (isTouchPrimary()) {
    document.body.classList.add('touch-ui');
  }
  if (isIOS()) {
    document.body.classList.add('ios');
  }

  const canvas = document.getElementById('application-canvas');
  const blockGameTouch = (e: TouchEvent) => {
    if (e.touches.length > 1) e.preventDefault();
  };
  canvas?.addEventListener('touchstart', blockGameTouch, { passive: false });
  canvas?.addEventListener('touchmove', blockGameTouch, { passive: false });

  const tap = document.getElementById('tap-start');
  const engage = () => {
    onFirstGesture();
    window.removeEventListener('pointerdown', engage);
    tap?.removeEventListener('click', engage);
  };
  window.addEventListener('pointerdown', engage, { once: true, passive: true });
  tap?.addEventListener('click', engage, { once: true });

  document.addEventListener(
    'touchmove',
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('.garage-list, .landmark-panel, .mission-panel, .journal-panel, details')) return;
      if (e.touches.length > 1) e.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') onFirstGesture();
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) onFirstGesture();
  });
}
