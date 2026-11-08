import { Color, StandardMaterial, type AppBase, type Asset, type Entity } from 'playcanvas';

import { appliedTuning } from './vehicle-customization';

type VehicleTuning = ReturnType<typeof appliedTuning>;

/** Kenney Car Kit (CC0) — shorepine/kenney mirror, see CREDITS.md */
const KENNEY = './models/kenney';
const CC0 = './models/cc0';

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
  'bonus-skyway-hover': `${KENNEY}/race-future.glb`,
  'bonus-coast-heli': `${CC0}/helicopter.glb`,
  'bonus-gotham-knight': `${KENNEY}/sedan-sports.glb`,
  'bonus-scarlet-five': `${KENNEY}/race.glb`,
  default: `${KENNEY}/sedan.glb`
};

const VISUAL_BY_ID: Record<string, GltfVisualOptions> = {
  'garage-ute': { scale: 2.15, yawOffsetDeg: 90, yOffset: -0.42 },
  'region-vallejo': { scale: 2.12, yawOffsetDeg: 90, yOffset: -0.4 },
  'region-marin-coast': { scale: 2.0, yawOffsetDeg: 90, yOffset: -0.38 },
  'bonus-skyway-hover': { scale: 2.25, yawOffsetDeg: 90, yOffset: -0.15 },
  'bonus-coast-heli': { scale: 0.32, yawOffsetDeg: -90, yOffset: -1.1 },
  'bonus-gotham-knight': { scale: 2.08, yawOffsetDeg: 90, yOffset: -0.3 },
  'bonus-scarlet-five': { scale: 2.05, yawOffsetDeg: 90, yOffset: -0.26 }
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

function visualOptsFor(vehicleId: string): GltfVisualOptions {
  return { ...DEFAULT_VISUAL, ...VISUAL_BY_ID[vehicleId] };
}

function applyGltfPaint(root: Entity, tuning: VehicleTuning): void {
  const stack: Entity[] = [root];
  const paintMix = Math.min(1, tuning.emissiveIntensity + 0.15);
  while (stack.length) {
    const e = stack.pop()!;
    const render = e.render;
    const instances = render?.meshInstances;
    if (instances) {
      for (const mi of instances) {
        const src = mi.material;
        if (!(src instanceof StandardMaterial)) continue;
        const m = src.clone() as StandardMaterial;
        m.diffuse = new Color(
          tuning.diffuse[0] * paintMix + src.diffuse.r * (1 - paintMix),
          tuning.diffuse[1] * paintMix + src.diffuse.g * (1 - paintMix),
          tuning.diffuse[2] * paintMix + src.diffuse.b * (1 - paintMix)
        );
        m.emissive = new Color(tuning.emissive[0], tuning.emissive[1], tuning.emissive[2]);
        m.emissiveIntensity = Math.max(tuning.emissiveIntensity * 0.55, tuning.rimGlow * 0.4);
        m.metalness = Math.min(0.85, 0.35 + tuning.rimGlow * 0.3);
        m.update();
        mi.material = m;
      }
    }
    for (let i = 0; i < e.children.length; i++) {
      stack.push(e.children[i] as Entity);
    }
  }
}

/** Attach Kenney / CC0 mesh as child; returns null if asset missing. */
export function attachVehicleGltf(
  parent: Entity,
  vehicleId: string,
  tuning?: VehicleTuning
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
  const opts = visualOptsFor(vehicleId);
  const s = opts.scale ?? DEFAULT_VISUAL.scale!;
  visual.setLocalScale(s, s, s);
  visual.setLocalPosition(0, opts.yOffset ?? DEFAULT_VISUAL.yOffset!, 0);
  visual.setLocalEulerAngles(0, opts.yawOffsetDeg ?? DEFAULT_VISUAL.yawOffsetDeg!, 0);
  parent.addChild(visual);
  if (tuning) applyGltfPaint(visual, tuning);
  return visual;
}

export function hasGltfForVehicle(vehicleId: string): boolean {
  return loaded.has(glbPathForVehicle(vehicleId));
}
