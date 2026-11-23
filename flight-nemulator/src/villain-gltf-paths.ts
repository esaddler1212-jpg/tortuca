const OVERRIDES: Record<string, string> = {
  'krypton-eclipse': './models/villains/krypton-eclipse.glb'
};

export function glbPathForVillain(villainId: string): string | null {
  return OVERRIDES[villainId] ?? null;
}

export function villainsWithBundledGlb(): string[] {
  return Object.keys(OVERRIDES);
}
