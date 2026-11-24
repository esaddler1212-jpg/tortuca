import { StandardMaterial, type AppBase, type Texture } from 'playcanvas';

let buildingAlbedo: Texture | null = null;

/** Tier 5 opt-in — AmbientCG facade when `textures/ambientcg/building-facade.jpg` exists. */
export async function preloadBuildingPbr(app: AppBase): Promise<void> {
  await new Promise<void>((resolve) => {
    app.assets.loadFromUrl('./textures/ambientcg/building-facade.jpg', 'texture', (err, asset) => {
      if (!err && asset?.resource) buildingAlbedo = asset.resource as Texture;
      resolve();
    });
  });
}

export function applyBuildingPbr(material: StandardMaterial): boolean {
  if (!buildingAlbedo) return false;
  material.diffuseMap = buildingAlbedo;
  material.update();
  return true;
}