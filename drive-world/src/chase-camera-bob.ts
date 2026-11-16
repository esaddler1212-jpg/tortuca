/** Mid-speed chase cam bob — screenshot-polish loop (cruise, not prologue). */
let phase = 0;

export function chaseCameraBobOffset(mph: number, dt: number): { y: number; lateral: number } {
  if (mph < 12) {
    phase = 0;
    return { y: 0, lateral: 0 };
  }
  phase += dt * (1.8 + mph * 0.035);
  const amp = Math.min(0.2, 0.028 + mph * 0.0012);
  return {
    y: Math.sin(phase) * amp,
    lateral: Math.sin(phase * 1.63) * amp * 0.4
  };
}