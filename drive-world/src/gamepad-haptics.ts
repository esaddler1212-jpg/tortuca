/** Xbox / DualSense rumble via Gamepad API (no-op on phone). */

export function pulseGamepad(
  strong: number,
  weak: number,
  durationMs: number,
  index = 0
): void {
  const gp = navigator.getGamepads?.()[index];
  const act = gp?.vibrationActuator;
  if (!act || typeof act.playEffect !== 'function') return;
  void act
    .playEffect('dual-rumble', {
      startDelay: 0,
      duration: Math.min(3000, Math.max(10, durationMs)),
      weakMagnitude: Math.max(0, Math.min(1, weak)),
      strongMagnitude: Math.max(0, Math.min(1, strong))
    })
    .catch(() => {});
}

export function hapticNitro(): void {
  pulseGamepad(0.35, 0.55, 80);
}

export function hapticDragGo(): void {
  pulseGamepad(0.9, 0.4, 180);
}

export function hapticParkingStar(stars: number): void {
  pulseGamepad(0.2 + stars * 0.15, 0.35, 120 + stars * 40);
}

export function hapticHeatChase(): void {
  pulseGamepad(0.7, 0.25, 220);
}

export function hapticMenu(): void {
  pulseGamepad(0.05, 0.12, 35);
}
