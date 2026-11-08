import {
  Color,
  Entity,
  StandardMaterial,
  Vec3,
  type AppBase
} from 'playcanvas';

import { getVehicleSpec } from './vehicle-catalog';
import { appliedTuning, DEFAULT_CUSTOMIZATION, type VehicleCustomization } from './vehicle-customization';
import { attachVehicleLights, type VehicleLights } from './vehicle-lights';
import { attachVehicleGltf, hasGltfForVehicle } from './vehicle-gltf';

const wheelDefs = [
  { name: 'FL', pos: new Vec3(0.95, 0.35, 1.35), front: true },
  { name: 'FR', pos: new Vec3(-0.95, 0.35, 1.35), front: true },
  { name: 'RL', pos: new Vec3(0.95, 0.35, -1.35), front: false },
  { name: 'RR', pos: new Vec3(-0.95, 0.35, -1.35), front: false }
];

function chassisMaterial(tuning: ReturnType<typeof appliedTuning>): StandardMaterial {
  const paint = new StandardMaterial();
  paint.diffuse = new Color(tuning.diffuse[0], tuning.diffuse[1], tuning.diffuse[2]);
  paint.emissive = new Color(tuning.emissive[0], tuning.emissive[1], tuning.emissive[2]);
  paint.emissiveIntensity = tuning.emissiveIntensity;
  paint.metalness = 0.4;
  paint.gloss = 0.6;
  paint.update();
  return paint;
}

export type PlayerVehicle = { entity: Entity; lights: VehicleLights };

export function createPlayerVehicle(
  app: AppBase,
  vehicleId: string,
  position: Vec3,
  yawDeg = 0,
  customization?: VehicleCustomization
): PlayerVehicle {
  const spec = getVehicleSpec(vehicleId);
  const custom = { ...DEFAULT_CUSTOMIZATION, ...customization };
  const tuning = appliedTuning(spec, custom);
  const paint = chassisMaterial(tuning);

  const glass = new StandardMaterial();
  glass.diffuse = new Color(0.05, 0.08, 0.12);
  glass.emissive = new Color(0.2, 0.5, 0.9);
  glass.emissiveIntensity = 0.22;
  glass.opacity = tuning.tintOpacity;
  glass.blendType = 2;
  glass.update();

  const rimMat = new StandardMaterial();
  rimMat.diffuse = new Color(0.08, 0.08, 0.1);
  rimMat.emissive = new Color(tuning.emissive[0], tuning.emissive[1], tuning.emissive[2]);
  rimMat.emissiveIntensity = tuning.rimGlow;
  rimMat.update();

  const useGltfBody = hasGltfForVehicle(vehicleId);
  const scaleWheel = spec.chassis.x / 0.95;
  const wheels = wheelDefs.map((def) => {
    const wheel = new Entity(def.name);
    wheel.addComponent('script');
    wheel.script!.create('vehicleWheel', {
      attributes: {
        debugRender: !useGltfBody,
        isFront: def.front,
        radius: 0.38 * Math.sqrt(scaleWheel) * tuning.wheelScale,
        width: 0.32,
        frictionSlip: tuning.frictionSlip,
        suspensionStiffness: 12
      }
    });
    const wy = def.pos.y - tuning.rideDrop;
    wheel.setLocalPosition(def.pos.x * scaleWheel, wy, def.pos.z * (spec.chassis.z / 1.9));
    return wheel;
  });

  const vehicle = new Entity(`vehicle-${vehicleId}`);
  vehicle.addComponent('rigidbody', {
    type: 'dynamic',
    mass: spec.mass,
    linearDamping: 0.02,
    angularDamping: 0.1
  });
  vehicle.addComponent('collision', { type: 'compound' });
  vehicle.addComponent('script');
  vehicle.script!.create('vehicle', {
    attributes: {
      wheels,
      maxEngineForce: tuning.maxEngineForce,
      maxBrakingForce: spec.maxBrakingForce,
      maxSteering: tuning.maxSteering
    }
  });
  vehicle.script!.create('vehicleControls');
  vehicle.setLocalPosition(position.x, position.y, position.z);
  vehicle.setEulerAngles(0, yawDeg, 0);

  const cx = spec.chassis.x;
  const cy = spec.chassis.y;
  const cz = spec.chassis.z;
  const bodyY = cy + 0.15 - tuning.rideDrop;

  const chassis = new Entity('chassis');
  chassis.addComponent('collision', { type: 'box', halfExtents: new Vec3(cx, cy, cz) });
  chassis.setLocalPosition(0, bodyY, 0);
  if (!useGltfBody) {
    chassis.addComponent('render', { type: 'box', material: paint });
  }

  const cabin = new Entity('cabin');
  cabin.addComponent('collision', { type: 'box', halfExtents: new Vec3(cx * 0.88, cy * 0.85, cz * 0.55) });
  cabin.setLocalPosition(0, cy * 2 + 0.15 - tuning.rideDrop, -cz * 0.12);
  if (!useGltfBody) {
    cabin.addComponent('render', { type: 'box', material: glass });
  }

  if (useGltfBody) {
    attachVehicleGltf(vehicle, vehicleId);
  }

  if (tuning.underglowIntensity > 0.05) {
    const glow = new Entity('underglow');
    glow.setLocalPosition(0, 0.12 - tuning.rideDrop, 0);
    glow.setLocalScale(cx * 2.2, 0.08, cz * 2.2);
    const gm = new StandardMaterial();
    gm.emissive = new Color(tuning.emissive[0], tuning.emissive[1], tuning.emissive[2]);
    gm.emissiveIntensity = tuning.underglowIntensity * 1.2;
    gm.diffuse = new Color(0.02, 0.02, 0.03);
    gm.update();
    glow.addComponent('render', { type: 'box', material: gm });
    glow.addComponent('light', {
      type: 'point',
      color: new Color(tuning.emissive[0], tuning.emissive[1], tuning.emissive[2]),
      intensity: tuning.underglowIntensity * 2.5,
      range: 6,
      castShadows: false
    });
    vehicle.addChild(glow);
  }

  if (!useGltfBody) {
    if (vehicleId.startsWith('region-south-bay')) {
      const wing = new Entity('ev-wing');
      wing.setLocalScale(0.15, 0.08, 1.6);
      wing.setLocalPosition(0, 0.75 - tuning.rideDrop, 0);
      wing.addComponent('render', { type: 'box', material: paint });
      vehicle.addChild(wing);
    } else if (vehicleId.startsWith('region-vallejo') || vehicleId.includes('ute')) {
      const rack = new Entity('bed-rack');
      rack.setLocalScale(0.9, 0.12, 0.55);
      rack.setLocalPosition(0, 1.05 - tuning.rideDrop, -cz * 0.45);
      rack.addComponent('render', { type: 'box', material: paint });
      vehicle.addChild(rack);
    } else if (vehicleId.startsWith('region-')) {
      const spoiler = new Entity('spoiler');
      spoiler.setLocalScale(cx * 1.1, 0.06, 0.35);
      spoiler.setLocalPosition(0, cy * 2.2 - tuning.rideDrop, -cz * 0.72);
      spoiler.addComponent('render', { type: 'box', material: paint });
      vehicle.addChild(spoiler);
    }
  }

  wheels.forEach((w) => {
    vehicle.addChild(w);
    if (!useGltfBody) {
      const rim = new Entity(`${w.name}-rim`);
      rim.setLocalScale(0.55, 0.2, 0.55);
      rim.setLocalPosition(0, 0, 0);
      rim.addComponent('render', { type: 'cylinder', material: rimMat });
      w.addChild(rim);
    }
  });
  vehicle.addChild(chassis);
  vehicle.addChild(cabin);
  const lights = attachVehicleLights(vehicle, app);
  app.root.addChild(vehicle);
  return { entity: vehicle, lights };
}

export function destroyPlayerVehicle(vehicle: Entity | null): void {
  if (!vehicle) return;
  vehicle.destroy();
}
