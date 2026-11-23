/** Drift/slide refills nitro — Summer racing template “drift fills boost” idea. */

export function driftNitroGain(steering: number, mph: number, driftingOnPad: boolean): number {
  const slide = Math.abs(steering) > 0.38 && mph > 16;
  if (!slide && !driftingOnPad) return 0;
  let rate = slide ? 0.14 : 0;
  if (driftingOnPad) rate += 0.1;
  return rate;
}