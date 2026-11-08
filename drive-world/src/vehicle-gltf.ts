import { type AppBase, type Asset, type Entity } from 'playcanvas';

/** Kenney Car Kit (CC0) — shorepine/kenney mirror, see CREDITS.md */
const KENNEY = './models/kenney';

/** glb file per vehicle id */
export const VEHICLE_GLB: Record<string, string> = {
  'garage-cruiser': `${KENNEY}/sedan.glb`,
  'garage-sport': `${KENNEY}/hatchback-sports.glb`,
  'garage-ute': `${KENNEY}/truck.glb`,
  'region-sf-night': `${KENNEY}/taxi.glb`,
  'region-marin-coast': `${KENNEY}/suv.glb`,
  'region-east-bay': `${KENNEY}/police.glb`,
  'region-vallejo': `${KENNEY}/delivery.glb`,
  'region-peninsula': `${KENNEY}/sedan.glb`,
  'region-south-bay': `${KENNEY}/race-future.glb`,
  default: `${KENNEY}/sedan.glb`
};

const loaded = new Map<string, Asset>();

function uniquePaths(): string[] {
  return [...new Set(Object.values(VEHICLE_GLB))];
}

export function glbPathForVehicle(vehicleId: string): string {
  return VEHICLE_GLB[vehicleId] ?? VEHICLE_GLB.default;
}

export function preloadVehicleModels(app: AppBase): Promise<void> {
  const paths = uniquePaths();
  return Promise.all(
    paths.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          if (loaded.has(url)) {
            resolve();
            return;
          }
          app.assets.loadFromUrl(url, 'container', (err, asset) => {
            if (err || !asset) {
              reject(err ?? new Error(`Failed to load ${url}`));
              return;
            }
            loaded.set(url, asset);
            resolve();
          });
        })
    )
  ).then(() => undefined);
}

export type GltfVisualOptions = {
  scale?: number;
  yawOffsetDeg?: number;
  yOffset?: number;
};

const DEFAULT_VISUAL: GltfVisualOptions = { scale: 2.05, yawOffsetDeg: 90, yOffset: -0.35 };

/** Attach Kenney mesh as child; returns null if asset missing. */
export function attachVehicleGltf(
  parent: Entity,
  vehicleId: string,
  opts: GltfVisualOptions = DEFAULT_VISUAL
): Entity | null {
  const url = glbPathForVehicle(vehicleId);
  const asset = loaded.get(url);
  if (!asset?.resource) return null;

  const resource = asset.resource as {
    instantiateRenderEntity?: (o?: object) => Entity;
    instantiateModelEntity?: (o?: object) => Entity;
  };

  let visual: Entity | null = null;
  if (resource.instantiateRenderEntity) {
    visual = resource.instantiateRenderEntity({ castShadows: true, receiveShadows: true });
  } else if (resource.instantiateModelEntity) {
    visual = resource.instantiateModelEntity({ castShadows: true });
  }
  if (!visual) return null;

  visual.name = 'gltf-body';
  const s = opts.scale ?? DEFAULT_VISUAL.scale!;
  visual.setLocalScale(s, s, s);
  visual.setLocalPosition(0, opts.yOffset ?? DEFAULT_VISUAL.yOffset!, 0);
  visual.setLocalEulerAngles(0, opts.yawOffsetDeg ?? DEFAULT_VISUAL.yawOffsetDeg!, 0);
  parent.addChild(visual);
  return visual;
}

export function hasGltfForVehicle(vehicleId: string): boolean {
  return loaded.has(glbPathForVehicle(vehicleId));
}
