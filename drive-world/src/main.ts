import {
  AppBase,
  AppOptions,
  Asset,
  AssetListLoader,
  CameraComponentSystem,
  CollisionComponentSystem,
  Color,
  Entity,
  FILLMODE_FILL_WINDOW,
  Keyboard,
  LightComponentSystem,
  ModelComponentSystem,
  RESOLUTION_AUTO,
  RenderComponentSystem,
  RigidBodyComponentSystem,
  ScriptComponentSystem,
  ScriptHandler,
  StandardMaterial,
  Vec3,
  WasmModule,
  createGraphicsDevice
} from 'playcanvas';

import { buildDrivingWorld } from './build-world';
import { NIGHT_AMBIENT, NIGHT_SKY } from './night-palette';
import { DRIVE_TUNING, WORLD_HALF_M } from './world-config';

WasmModule.setConfig('Ammo', {
  glueUrl: './ammo/ammo.wasm.js',
  wasmUrl: './ammo/ammo.wasm.wasm'
});

await new Promise<void>((resolve) => {
  WasmModule.getInstance('Ammo', () => resolve());
});

const canvas = document.getElementById('application-canvas') as HTMLCanvasElement;
const speedEl = document.getElementById('speed') as HTMLParagraphElement;

const device = await createGraphicsDevice(canvas);
device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);

const options = new AppOptions();
options.graphicsDevice = device;
options.keyboard = new Keyboard(window);

const vehicleScript = new Asset('vehicle-script', 'script', { url: './scripts/vehicle.js' });
options.mouse = undefined;
options.componentSystems = [
  RenderComponentSystem,
  ModelComponentSystem,
  CameraComponentSystem,
  LightComponentSystem,
  ScriptComponentSystem,
  CollisionComponentSystem,
  RigidBodyComponentSystem
];
options.resourceHandlers = [ScriptHandler];

const app = new AppBase(canvas);
app.init(options);
app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);

const resize = () => app.resizeCanvas();
window.addEventListener('resize', resize);

await new Promise<void>((resolve) => {
  new AssetListLoader([vehicleScript], app.assets).load(() => resolve());
});

app.start();

app.scene.ambientLight = NIGHT_AMBIENT.clone();
app.scene.exposure = 0.55;
app.scene.fogStart = 90;
app.scene.fogEnd = Math.min(2200, WORLD_HALF_M * 1.05);

buildDrivingWorld(app);

const wheelDefs = [
  { name: 'FL', pos: new Vec3(0.95, 0.35, 1.35), front: true },
  { name: 'FR', pos: new Vec3(-0.95, 0.35, 1.35), front: true },
  { name: 'RL', pos: new Vec3(0.95, 0.35, -1.35), front: false },
  { name: 'RR', pos: new Vec3(-0.95, 0.35, -1.35), front: false }
];

const wheels = wheelDefs.map((def) => {
  const wheel = new Entity(def.name);
  wheel.addComponent('script');
  wheel.script!.create('vehicleWheel', {
    attributes: {
      debugRender: true,
      isFront: def.front,
      radius: 0.38,
      width: 0.32,
      frictionSlip: 1200,
      suspensionStiffness: 12
    }
  });
  wheel.setLocalPosition(def.pos);
  return wheel;
});

const paint = new StandardMaterial();
paint.diffuse = new Color(0.12, 0.12, 0.14);
paint.emissive = new Color(0.95, 0.2, 0.45);
paint.emissiveIntensity = 0.35;
paint.metalness = 0.4;
paint.gloss = 0.6;
paint.update();

const glass = new StandardMaterial();
glass.diffuse = new Color(0.05, 0.08, 0.12);
glass.emissive = new Color(0.2, 0.5, 0.9);
glass.emissiveIntensity = 0.25;
glass.opacity = 0.65;
glass.blendType = 2;
glass.update();

const vehicle = new Entity('vehicle');
vehicle.addComponent('rigidbody', {
  type: 'dynamic',
  mass: DRIVE_TUNING.mass,
  linearDamping: DRIVE_TUNING.linearDamping,
  angularDamping: 0.1
});
vehicle.addComponent('collision', { type: 'compound' });
vehicle.addComponent('script');
vehicle.script!.create('vehicle', {
  attributes: {
    wheels,
    maxEngineForce: DRIVE_TUNING.maxEngineForce,
    maxBrakingForce: DRIVE_TUNING.maxBrakingForce,
    maxSteering: DRIVE_TUNING.maxSteering
  }
});
vehicle.script!.create('vehicleControls');
vehicle.setLocalPosition(0, 1.5, 0);

const chassis = new Entity('chassis');
chassis.addComponent('collision', { type: 'box', halfExtents: new Vec3(0.95, 0.4, 1.9) });
chassis.setLocalPosition(0, 0.55, 0);
chassis.addComponent('render', { type: 'box', material: paint });

const cabin = new Entity('cabin');
cabin.addComponent('collision', { type: 'box', halfExtents: new Vec3(0.85, 0.35, 1.1) });
cabin.setLocalPosition(0, 1.05, -0.2);
cabin.addComponent('render', { type: 'box', material: glass });

wheels.forEach((w) => vehicle.addChild(w));
vehicle.addChild(chassis);
vehicle.addChild(cabin);
app.root.addChild(vehicle);

const moon = new Entity('moon');
moon.addComponent('light', {
  type: 'directional',
  color: new Color(0.45, 0.5, 0.75),
  intensity: 0.22,
  castShadows: true,
  shadowDistance: 140,
  shadowResolution: 1024
});
moon.setEulerAngles(55, 30, 0);
app.root.addChild(moon);

const camera = new Entity('camera');
camera.addComponent('camera', {
  fov: 74,
  farClip: 2800,
  clearColor: NIGHT_SKY.clone()
});
app.root.addChild(camera);

const camOffset = new Vec3(0, 3.2, 7.5);
const lookAhead = 12;

app.on('update', () => {
  const pos = vehicle.getPosition();
  const forward = vehicle.forward;
  const right = vehicle.right;
  const target = new Vec3(
    pos.x - forward.x * camOffset.z + right.x * camOffset.x,
    pos.y + camOffset.y,
    pos.z - forward.z * camOffset.z + right.z * camOffset.x
  );
  camera.setPosition(target);
  const look = new Vec3(pos.x + forward.x * lookAhead, pos.y + 0.8, pos.z + forward.z * lookAhead);
  camera.lookAt(look);

  const vehScript = vehicle.script?.vehicle as { speed?: number } | undefined;
  const kph = vehScript?.speed ?? 0;
  const mph = Math.abs(kph) * 0.621371;
  speedEl.textContent = `${mph.toFixed(0)} mph`;
});
