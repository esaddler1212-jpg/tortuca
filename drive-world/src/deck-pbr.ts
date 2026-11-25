import { Color, StandardMaterial, type AppBase, type Texture } from 'playcanvas';

let deckAlbedo: Texture | null = null;

/** Optional AmbientCG asphalt — `install-free-packs.sh --pbr-decks`. */
export async function preloadDeckPbr(app: AppBase): Promise<void> {
  await new Promise<void>((resolve) => {
    app.assets.loadFromUrl('./textures/ambientcg/deck-asphalt.jpg', 'texture', (err, asset) => {
      if (!err && asset?.resource) deckAlbedo = asset.resource as Texture;
      resolve();
    });
  });
}

/** Street decks / plazas — PBR albedo when installed, else procedural kit fallback. */
export function kitDeckMaterial(em: Color, glow = 0.08, diffuse?: Color): StandardMaterial {
  const m = new StandardMaterial();
  if (deckAlbedo) {
    m.diffuseMap = deckAlbedo;
    m.diffuse = new Color(1, 1, 1);
    m.gloss = 0.28;
    m.metalness = 0.05;
  } else {
    m.diffuse = diffuse ?? new Color(0.06, 0.06, 0.07);
    m.gloss = 0.4;
  }
  m.emissive = em.clone();
  m.emissiveIntensity = glow;
  m.update();
  return m;
}

export function deckPbrReady(): boolean {
  return deckAlbedo !== null;
}