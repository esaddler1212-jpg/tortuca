import { unlockAudio } from './game-audio';
import { unlockMusic } from './game-music';
import { pollGamepadConfirmEdge } from './gamepad-hub';
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
  const sub = tap?.querySelector('.tap-start-sub');
  if (sub && !isTouchPrimary()) {
    sub.textContent = 'Tap, click, or press A / Start on a controller';
  }
  let gamepadBootRaf = 0;
  const engage = () => {
    onFirstGesture();
    window.removeEventListener('pointerdown', engage);
    tap?.removeEventListener('click', engage);
    cancelAnimationFrame(gamepadBootRaf);
  };
  // Gamepad buttons are not a user activation in most browsers, so keep retrying audio on real gestures.
  const retryAudio = () => {
    unlockAudio();
    void unlockMusic();
  };
  window.addEventListener('keydown', retryAudio, { passive: true });
  window.addEventListener('pointerdown', retryAudio, { passive: true });
  const pollGamepadBoot = () => {
    if (pollGamepadConfirmEdge()) {
      engage();
      return;
    }
    gamepadBootRaf = requestAnimationFrame(pollGamepadBoot);
  };
  gamepadBootRaf = requestAnimationFrame(pollGamepadBoot);
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
