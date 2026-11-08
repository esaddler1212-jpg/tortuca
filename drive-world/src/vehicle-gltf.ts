import { Color, StandardMaterial, type AppBase, type Asset, type Entity } from 'playcanvas';

import { appliedTuning } from './vehicle-customization';
import { glbPathForVehicle as pathForId } from './vehicle-gltf-paths';

export { VEHICLE_GLB, glbPathForVehicle } from './vehicle-gltf-paths';

type VehicleTuning = ReturnType<typeof appliedTuning>;

const loaded = new Map<string, Asset>();

const BOOT_PATHS = ['./models/kenney/sedan.glb', './models/kenney/race-future.glb'];

function loadUrl(app: AppBase, url: string): Promise<void> {
  if (loaded.has(url)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    app.assets.loadFromUrl(url, 'container', (err, asset) => {
      if (err || !asset) {
        reject(err ?? new Error(`Failed to load ${url}`));
        return;
      }
      loaded.set(url, asset);
      resolve();
    });
  });
}

/** Small first paint — starter sedan + hover mesh shared by Waymo path. */
export function preloadBootVehicleModels(app: AppBase): Promise<void> {
  return Promise.all(BOOT_PATHS.map((url) => loadUrl(app, url))).then(() => undefined);
}

export async function ensureVehicleModelLoaded(app: AppBase, vehicleId: string): Promise<void> {
  const url = pathForId(vehicleId);
  if (!url) return;
  await loadUrl(app, url);
}

export async function ensureVehicleModelsLoaded(app: AppBase, vehicleIds: string[]): Promise<void> {
  const paths = [...new Set(vehicleIds.map((id) => pathForId(id)).filter((u): u is string => Boolean(u)))];
  await Promise.all(paths.map((url) => loadUrl(app, url)));
}

export type GltfVisualOptions = {
  scale?: number;
  yawOffsetDeg?: number;
  yOffset?: number;
};

const DEFAULT_VISUAL: GltfVisualOptions = { scale: 2.05, yawOffsetDeg: 90, yOffset: -0.35 };

const VISUAL_BY_ID: Record<string, GltfVisualOptions> = {
  'garage-ute': { scale: 2.15, yawOffsetDeg: 90, yOffset: -0.42 },
  'region-vallejo': { scale: 2.12, yawOffsetDeg: 90, yOffset: -0.4 },
  'region-marin-coast': { scale: 2.0, yawOffsetDeg: 90, yOffset: -0.38 },
  'bonus-skyway-hover': { scale: 2.28, yawOffsetDeg: 90, yOffset: -0.12 },
  'bonus-coast-heli': { scale: 0.34, yawOffsetDeg: -90, yOffset: -1.05 },
  'bonus-gotham-knight': { scale: 2.08, yawOffsetDeg: 90, yOffset: -0.3 },
  'bonus-scarlet-five': { scale: 2.05, yawOffsetDeg: 90, yOffset: -0.26 },
  'bonus-night-coil': { scale: 2.1, yawOffsetDeg: 90, yOffset: -0.28 },
  'tokyo-drift-monarch': { scale: 2.06, yawOffsetDeg: 90, yOffset: -0.24 },
  'tokyo-teal-phantom': { scale: 2.04, yawOffsetDeg: 90, yOffset: -0.28 },
  'tokyo-kabuki-z': { scale: 2.02, yawOffsetDeg: 90, yOffset: -0.26 },
  'tokyo-gold-linx': { scale: 2.05, yawOffsetDeg: 90, yOffset: -0.3 },
  'tokyo-neon-evo': { scale: 2.0, yawOffsetDeg: 90, yOffset: -0.22 },
  'tokyo-c1-boost': { scale: 2.04, yawOffsetDeg: 90, yOffset: -0.22 },
  'tokyo-family-van': { scale: 2.22, yawOffsetDeg: 90, yOffset: -0.46 },
  'tokyo-shuto-runner': { scale: 2.08, yawOffsetDeg: 90, yOffset: -0.24 },
  'bonus-bay-van': { scale: 2.18, yawOffsetDeg: 90, yOffset: -0.44 },
  'bonus-night-delivery': { scale: 2.14, yawOffsetDeg: 90, yOffset: -0.4 },
  'bonus-marina-hatch': { scale: 2.02, yawOffsetDeg: 90, yOffset: -0.3 },
  'legend-time-warp': { scale: 2.05, yawOffsetDeg: 90, yOffset: -0.22 },
  'legend-hyphy-shortbus': { scale: 2.35, yawOffsetDeg: 90, yOffset: -0.5 },
  'legend-cookie-bus': { scale: 2.28, yawOffsetDeg: 90, yOffset: -0.48 },
  'legend-say-hey-cadillac': { scale: 2.12, yawOffsetDeg: 90, yOffset: -0.36 },
  'garage-drifter': { scale: 2.0, yawOffsetDeg: 90, yOffset: -0.26 },
  'meet-vallejo-lot': { scale: 2.04, yawOffsetDeg: 90, yOffset: -0.24 },
  'meet-sf-flash': { scale: 2.02, yawOffsetDeg: 90, yOffset: -0.28 },
  'meet-marin-breeze': { scale: 2.08, yawOffsetDeg: 90, yOffset: -0.42 },
  'meet-east-donk': { scale: 2.2, yawOffsetDeg: 90, yOffset: -0.46 },
  'meet-pen-low': { scale: 2.02, yawOffsetDeg: 90, yOffset: -0.3 },
  'meet-south-arc': { scale: 2.0, yawOffsetDeg: 90, yOffset: -0.2 },
  'bonus-sprint-king': { scale: 2.0, yawOffsetDeg: 90, yOffset: -0.2 },
  'bonus-chapter-hauler': { scale: 2.2, yawOffsetDeg: 90, yOffset: -0.44 },
  'bonus-vista-liner': { scale: 2.08, yawOffsetDeg: 90, yOffset: -0.42 },
  'bonus-heat-shade': { scale: 2.06, yawOffsetDeg: 90, yOffset: -0.28 },
  'bonus-trap-outlaw': { scale: 2.1, yawOffsetDeg: 90, yOffset: -0.36 },
  'craft-bay-wedge': { scale: 2.04, yawOffsetDeg: 90, yOffset: -0.26 },
  'craft-night-lift': { scale: 2.1, yawOffsetDeg: 90, yOffset: -0.42 },
  'craft-street-spike': { scale: 1.98, yawOffsetDeg: 90, yOffset: -0.22 }
};

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
  const url = pathForId(vehicleId);
  if (!url) return null;
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
  const url = pathForId(vehicleId);
  if (!url) return false;
  return loaded.has(url);
}
