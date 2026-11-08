import {
  Color,
  Entity,
  StandardMaterial,
  Vec3,
  type AppBase
} from 'playcanvas';

import { CRAFT_VEHICLE_IDS, getVehicleSpec } from './vehicle-catalog';
import { attachCraftVehicleMesh } from './craft-vehicle-mesh';
import { appliedTuning, mergeCustomization, type VehicleCustomization } from './vehicle-customization';
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

function attachLegendAccents(
  vehicle: Entity,
  vehicleId: string,
  paint: StandardMaterial,
  cx: number,
  cz: number,
  rideDrop: number
): void {
  if (vehicleId === 'bonus-gotham-knight') {
    const finMat = paint.clone() as StandardMaterial;
    finMat.emissive = new Color(0.08, 0.12, 0.55);
    finMat.emissiveIntensity = 0.45;
    finMat.update();
    for (const side of [-1, 1]) {
      const fin = new Entity(`bat-fin-${side}`);
      fin.setLocalScale(0.07, 0.55, 1.05);
      fin.setLocalPosition(side * 0.58, 0.52 - rideDrop, -cz * 0.52);
      fin.setLocalEulerAngles(0, 0, side * 32);
      fin.addComponent('render', { type: 'box', material: finMat });
      vehicle.addChild(fin);
    }
    const scoop = new Entity('bat-scoop');
    scoop.setLocalScale(0.9, 0.14, 0.45);
    scoop.setLocalPosition(0, 0.28 - rideDrop, cz * 0.62);
    scoop.addComponent('render', { type: 'box', material: finMat });
    vehicle.addChild(scoop);
  }
  if (vehicleId === 'bonus-night-coil') {
    const glass = new StandardMaterial();
    glass.diffuse = new Color(0.05, 0.05, 0.06);
    glass.emissive = new Color(0.75, 0.78, 0.82);
    glass.emissiveIntensity = 0.35;
    glass.opacity = 0.85;
    glass.blendType = 2;
    glass.update();
    const roof = new Entity('coil-glass');
    roof.setLocalScale(cx * 0.82, 0.06, cz * 0.52);
    roof.setLocalPosition(0, 0.58 - rideDrop, cz * 0.05);
    roof.addComponent('render', { type: 'box', material: glass });
    vehicle.addChild(roof);
    const bar = new Entity('coil-lightbar');
    const barMat = paint.clone() as StandardMaterial;
    barMat.emissive = new Color(0.95, 0.96, 0.98);
    barMat.emissiveIntensity = 0.55;
    barMat.update();
    bar.setLocalScale(0.12, 0.04, 0.55);
    bar.setLocalPosition(0, 0.72 - rideDrop, cz * 0.35);
    bar.addComponent('render', { type: 'box', material: barMat });
    vehicle.addChild(bar);
  }
  if (vehicleId === 'legend-time-warp') {
    const flux = new StandardMaterial();
    flux.emissive = new Color(0.15, 0.55, 0.95);
    flux.emissiveIntensity = 0.75;
    flux.update();
    for (const zOff of [-0.35, 0.35]) {
      const band = new Entity('flux-band');
      band.setLocalScale(cx * 0.92, 0.08, 0.12);
      band.setLocalPosition(0, 0.35 - rideDrop, zOff * cz * 0.55);
      band.addComponent('render', { type: 'box', material: flux });
      vehicle.addChild(band);
    }
  }
  if (vehicleId === 'legend-hyphy-shortbus') {
    const sub = new StandardMaterial();
    sub.emissive = new Color(0.95, 0.85, 0.1);
    sub.emissiveIntensity = 0.8;
    sub.update();
    const stack = new Entity('hyphy-sub');
    stack.setLocalScale(0.85, 0.5, 0.75);
    stack.setLocalPosition(0, 1.05 - rideDrop, 0);
    stack.addComponent('render', { type: 'box', material: sub });
    vehicle.addChild(stack);
  }
  if (vehicleId === 'legend-cookie-bus') {
    const logo = new StandardMaterial();
    logo.emissive = new Color(0.4, 0.25, 0.12);
    logo.emissiveIntensity = 0.55;
    logo.update();
    const sign = new Entity('cookie-sign');
    sign.setLocalScale(0.9, 0.45, 0.08);
    sign.setLocalPosition(0, 1.15 - rideDrop, cz * 0.52);
    sign.addComponent('render', { type: 'box', material: logo });
    vehicle.addChild(sign);
  }
  if (vehicleId === 'legend-say-hey-cadillac') {
    const pink = new StandardMaterial();
    pink.emissive = new Color(0.92, 0.35, 0.6);
    pink.emissiveIntensity = 0.45;
    pink.update();
    for (const side of [-1, 1]) {
      const fin = new Entity('caddy-fin');
      fin.setLocalScale(0.08, 0.32, 0.55);
      fin.setLocalPosition(side * cx * 0.55, 0.65 - rideDrop, -cz * 0.35);
      fin.addComponent('render', { type: 'box', material: pink });
      vehicle.addChild(fin);
    }
  }
  if (vehicleId === 'legend-beast-cart') {
    const bar = new StandardMaterial();
    bar.emissive = new Color(0.35, 0.4, 0.45);
    bar.emissiveIntensity = 0.5;
    bar.update();
    const cage = new Entity('cart-cage');
    cage.setLocalScale(cx * 1.1, 0.55, cz * 0.85);
    cage.setLocalPosition(0, 0.85 - rideDrop, 0);
    cage.addComponent('render', { type: 'box', material: bar });
    vehicle.addChild(cage);
  }
  if (vehicleId === 'bonus-scarlet-five') {
    const red = new StandardMaterial();
    red.diffuse = new Color(0.82, 0.07, 0.05);
    red.emissive = new Color(0.95, 0.15, 0.08);
    red.emissiveIntensity = 0.55;
    red.update();
    const nose = new Entity('mach-nose');
    nose.setLocalScale(0.32, 0.15, 0.2);
    nose.setLocalPosition(0, 0.46 - rideDrop, cz * 0.82);
    nose.addComponent('render', { type: 'box', material: red });
    vehicle.addChild(nose);
    const stripe = new Entity('mach-stripe');
    stripe.setLocalScale(cx * 1.05, 0.04, 0.06);
    stripe.setLocalPosition(0, 0.62 - rideDrop, cz * 0.05);
    stripe.addComponent('render', { type: 'box', material: red });
    vehicle.addChild(stripe);
  }
}

function createAerialVehicle(
  app: AppBase,
  vehicleId: string,
  position: Vec3,
  yawDeg: number,
  spec: ReturnType<typeof getVehicleSpec>,
  tuning: ReturnType<typeof appliedTuning>,
  paint: StandardMaterial
): PlayerVehicle {
  const cx = spec.chassis.x;
  const cy = spec.chassis.y;
  const cz = spec.chassis.z;
  const flightMode = spec.locomotion === 'helicopter' ? 'helicopter' : 'hover';

  const vehicle = new Entity(`vehicle-${vehicleId}`);
  vehicle.addComponent('rigidbody', {
    type: 'dynamic',
    mass: spec.mass,
    linearDamping: 0.48,
    angularDamping: 1.05
  });
  vehicle.addComponent('collision', { type: 'box', halfExtents: new Vec3(cx, cy, cz) });
  vehicle.addComponent('script');
  vehicle.script!.create('flightVehicle', {
    attributes: {
      mode: flightMode,
      thrust: spec.locomotion === 'helicopter' ? 34000 : 28500,
      lift: spec.locomotion === 'helicopter' ? 36000 : 32000,
      yawRate: spec.locomotion === 'helicopter' ? 1.35 : 1.1,
      pitchRate: spec.locomotion === 'helicopter' ? 0.95 : 0.8
    }
  });
  vehicle.setLocalPosition(position.x, position.y, position.z);
  vehicle.setEulerAngles(0, yawDeg, 0);

  const body = new Entity('hull');
  body.addComponent('collision', { type: 'box', halfExtents: new Vec3(cx * 0.92, cy * 0.85, cz * 0.48) });
  body.setLocalPosition(0, cy + 0.1 - tuning.rideDrop, 0);
  if (!hasGltfForVehicle(vehicleId)) {
    body.addComponent('render', { type: 'box', material: paint });
  }
  vehicle.addChild(body);

  if (hasGltfForVehicle(vehicleId)) {
    attachVehicleGltf(vehicle, vehicleId, tuning);
  }

  if (spec.locomotion === 'hover') {
    const rotor = new Entity('hover-emitter');
    rotor.setLocalScale(0.35, 0.06, 0.35);
    rotor.setLocalPosition(0, -0.2 - tuning.rideDrop, 0);
    const em = new StandardMaterial();
    em.emissive = new Color(tuning.emissive[0], tuning.emissive[1], tuning.emissive[2]);
    em.emissiveIntensity = tuning.emissiveIntensity * 1.4;
    em.update();
    rotor.addComponent('render', { type: 'cylinder', material: em });
    vehicle.addChild(rotor);
  }

  const lights = attachVehicleLights(vehicle);
  app.root.addChild(vehicle);
  return { entity: vehicle, lights };
}

export function createPlayerVehicle(
  app: AppBase,
  vehicleId: string,
  position: Vec3,
  yawDeg = 0,
  customization?: VehicleCustomization
): PlayerVehicle {
  const spec = getVehicleSpec(vehicleId);
  const custom = mergeCustomization(customization);
  const tuning = appliedTuning(spec, custom);
  const paint = chassisMaterial(tuning);

  if (spec.locomotion !== 'ground') {
    return createAerialVehicle(app, vehicleId, position, yawDeg, spec, tuning, paint);
  }

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
  const useCraftBody = (CRAFT_VEHICLE_IDS as readonly string[]).includes(vehicleId);
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
    wheel.setLocalEulerAngles(0, 0, def.front ? tuning.camberDeg : tuning.camberDeg * 0.85);
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
  if (!useGltfBody && !useCraftBody) {
    chassis.addComponent('render', { type: 'box', material: paint });
  }

  const cabin = new Entity('cabin');
  cabin.addComponent('collision', { type: 'box', halfExtents: new Vec3(cx * 0.88, cy * 0.85, cz * 0.55) });
  cabin.setLocalPosition(0, cy * 2 + 0.15 - tuning.rideDrop, -cz * 0.12);
  if (!useGltfBody && !useCraftBody) {
    cabin.addComponent('render', { type: 'box', material: glass });
  }

  if (useGltfBody) {
    attachVehicleGltf(vehicle, vehicleId, tuning);
  } else if (useCraftBody) {
    attachCraftVehicleMesh(vehicle, vehicleId, custom);
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

  if (tuning.spoilerScale > 0.42) {
    const spoiler = new Entity('tune-spoiler');
    spoiler.setLocalScale(cx * tuning.spoilerScale, 0.05 + tuning.spoilerScale * 0.04, 0.28 + tuning.spoilerScale * 0.2);
    spoiler.setLocalPosition(0, cy * 2.05 - tuning.rideDrop, -cz * 0.78);
    spoiler.addComponent('render', { type: 'box', material: paint });
    vehicle.addChild(spoiler);
  }
  if (tuning.stripeIntensity > 0.08) {
    const stripeMat = paint.clone() as StandardMaterial;
    stripeMat.emissive = new Color(
      Math.min(1, tuning.emissive[0] + 0.35),
      Math.min(1, tuning.emissive[1] + 0.35),
      Math.min(1, tuning.emissive[2] + 0.35)
    );
    stripeMat.emissiveIntensity = tuning.emissiveIntensity * (0.5 + tuning.stripeIntensity);
    stripeMat.update();
    const stripe = new Entity('livery-stripe');
    stripe.setLocalScale(cx * 1.02, 0.035, 0.05);
    stripe.setLocalPosition(0, cy * 1.6 - tuning.rideDrop, cz * 0.05);
    stripe.addComponent('render', { type: 'box', material: stripeMat });
    vehicle.addChild(stripe);
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
  if (
    vehicleId === 'bonus-gotham-knight' ||
    vehicleId === 'bonus-scarlet-five' ||
    vehicleId.startsWith('legend-')
  ) {
    attachLegendAccents(vehicle, vehicleId, paint, cx, cz, tuning.rideDrop);
  }
  const lights = attachVehicleLights(vehicle);
  app.root.addChild(vehicle);
  return { entity: vehicle, lights };
}

export function destroyPlayerVehicle(vehicle: Entity | null): void {
  if (!vehicle) return;
  vehicle.destroy();
}
