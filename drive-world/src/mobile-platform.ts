/** iPhone, iPad, iPod (incl. iPadOS desktop UA). */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

export function isTouchPrimary(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.maxTouchPoints > 0;
}

export function recommendedPixelRatio(): number {
  const dpr = window.devicePixelRatio || 1;
  if (isIOS()) return Math.min(dpr, 1.5);
  if (isTouchPrimary()) return Math.min(dpr, 1.75);
  return Math.min(dpr, 2);
}
