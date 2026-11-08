import {
  Color,
  Entity,
  StandardMaterial,
  Vec3,
  type AppBase
} from 'playcanvas';

import { getVehicleSpec, type VehicleSpec } from './vehicle-catalog';

const wheelDefs = [
  { name: 'FL', pos: new Vec3(0.95, 0.35, 1.35), front: true },
  { name: 'FR', pos: new Vec3(-0.95, 0.35, 1.35), front: true },
  { name: 'RL', pos: new Vec3(0.95, 0.35, -1.35), front: false },
  { name: 'RR', pos: new Vec3(-0.95, 0.35, -1.35), front: false }
];

function materialFromPaint(spec: VehicleSpec): StandardMaterial {
  const paint = new StandardMaterial();
  const p = spec.paint;
  paint.diffuse = new Color(p.diffuse[0], p.diffuse[1], p.diffuse[2]);
  paint.emissive = new Color(p.emissive[0], p.emissive[1], p.emissive[2]);
  paint.emissiveIntensity = p.emissiveIntensity;
  paint.metalness = 0.4;
  paint.gloss = 0.6;
  paint.update();
  return paint;
}

export function createPlayerVehicle(app: AppBase, vehicleId: string, position: Vec3, yawDeg = 0): Entity {
  const spec = getVehicleSpec(vehicleId);
  const paint = materialFromPaint(spec);

  const glass = new StandardMaterial();
  glass.diffuse = new Color(0.05, 0.08, 0.12);
  glass.emissive = new Color(0.2, 0.5, 0.9);
  glass.emissiveIntensity = 0.22;
  glass.opacity = 0.65;
  glass.blendType = 2;
  glass.update();

  const scaleWheel = spec.chassis.x / 0.95;
  const wheels = wheelDefs.map((def) => {
    const wheel = new Entity(def.name);
    wheel.addComponent('script');
    wheel.script!.create('vehicleWheel', {
      attributes: {
        debugRender: true,
        isFront: def.front,
        radius: 0.38 * Math.sqrt(scaleWheel),
        width: 0.32,
        frictionSlip: 1180,
        suspensionStiffness: 12
      }
    });
    wheel.setLocalPosition(def.pos.x * scaleWheel, def.pos.y, def.pos.z * (spec.chassis.z / 1.9));
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
      maxEngineForce: spec.maxEngineForce,
      maxBrakingForce: spec.maxBrakingForce,
      maxSteering: spec.maxSteering
    }
  });
  vehicle.script!.create('vehicleControls');
  vehicle.setLocalPosition(position.x, position.y, position.z);
  vehicle.setEulerAngles(0, yawDeg, 0);

  const cx = spec.chassis.x;
  const cy = spec.chassis.y;
  const cz = spec.chassis.z;

  const chassis = new Entity('chassis');
  chassis.addComponent('collision', { type: 'box', halfExtents: new Vec3(cx, cy, cz) });
  chassis.setLocalPosition(0, cy + 0.15, 0);
  chassis.addComponent('render', { type: 'box', material: paint });

  const cabin = new Entity('cabin');
  cabin.addComponent('collision', { type: 'box', halfExtents: new Vec3(cx * 0.88, cy * 0.85, cz * 0.55) });
  cabin.setLocalPosition(0, cy * 2 + 0.15, -cz * 0.12);
  cabin.addComponent('render', { type: 'box', material: glass });

  wheels.forEach((w) => vehicle.addChild(w));
  vehicle.addChild(chassis);
  vehicle.addChild(cabin);
  app.root.addChild(vehicle);
  return vehicle;
}

export function destroyPlayerVehicle(vehicle: Entity | null): void {
  if (!vehicle) return;
  vehicle.destroy();
}
