export const BUNDLED_VILLAIN_GLB_IDS = [
  'krypton-eclipse',
  'venom-echo',
  'doctor-doom',
  'titan-snap-echo',
  'android-phalanx'
] as const;

const OVERRIDES: Record<string, string> = {
  'krypton-eclipse': './models/villains/krypton-eclipse.glb',
  'venom-echo': './models/villains/venom-echo.glb',
  'doctor-doom': './models/villains/doctor-doom.glb',
  'titan-snap-echo': './models/villains/titan-snap-echo.glb',
  'android-phalanx': './models/villains/android-phalanx.glb'
};

export function glbPathForVillain(villainId: string): string {
  return OVERRIDES[villainId] ?? `./models/villains/${villainId}.glb`;
}

export function villainsWithBundledGlb(): string[] {
  return [...BUNDLED_VILLAIN_GLB_IDS];
}
