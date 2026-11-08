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

app.scene.ambientLight = new Color(0.35, 0.38, 0.45);
app.scene.fog = Color.BLACK;
app.scene.fogStart = 80;
app.scene.fogEnd = 420;

const asphalt = new StandardMaterial();
asphalt.diffuse = new Color(0.12, 0.13, 0.15);
asphalt.gloss = 0.25;
asphalt.update();

const stripe = new StandardMaterial();
stripe.diffuse = new Color(0.92, 0.9, 0.82);
stripe.emissive = new Color(0.08, 0.08, 0.06);
stripe.update();

const grass = new StandardMaterial();
grass.diffuse = new Color(0.15, 0.35, 0.18);
grass.update();

/** Prototype “open world” flat — replace with heightfields + streaming (see docs). */
const WORLD_HALF = 200;

const ground = new Entity('ground');
ground.setLocalScale(WORLD_HALF * 2, 0.4, WORLD_HALF * 2);
ground.setPosition(0, -0.2, 0);
ground.addComponent('render', { type: 'box', material: asphalt });
ground.addComponent('collision', { type: 'box', halfExtents: new Vec3(WORLD_HALF, 0.2, WORLD_HALF) });
ground.addComponent('rigidbody', { type: 'static' });
app.root.addChild(ground);

for (let z = -WORLD_HALF + 40; z < WORLD_HALF; z += 80) {
  const band = new Entity(`stripe-${z}`);
  band.setLocalScale(8, 0.05, 2);
  band.setPosition(0, 0.02, z);
  band.addComponent('render', { type: 'box', material: stripe });
  app.root.addChild(band);
}

const pad = new Entity('spawn-pad');
pad.setLocalScale(24, 0.1, 24);
pad.setPosition(0, 0.01, 0);
pad.addComponent('render', { type: 'box', material: grass });
app.root.addChild(pad);

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
    attributes: { debugRender: true, isFront: def.front, radius: 0.38, width: 0.32 }
  });
  wheel.setLocalPosition(def.pos);
  return wheel;
});

const paint = new StandardMaterial();
paint.diffuse = new Color(0.78, 0.14, 0.12);
paint.metalness = 0.35;
paint.gloss = 0.55;
paint.update();

const glass = new StandardMaterial();
glass.diffuse = new Color(0.2, 0.25, 0.35);
glass.opacity = 0.55;
glass.blendType = 2;
glass.update();

const vehicle = new Entity('vehicle');
vehicle.addComponent('rigidbody', { type: 'dynamic', mass: 1100, linearDamping: 0.05, angularDamping: 0.12 });
vehicle.addComponent('collision', { type: 'compound' });
vehicle.addComponent('script');
vehicle.script!.create('vehicle', {
  attributes: {
    wheels,
    maxEngineForce: 2800,
    maxBrakingForce: 120,
    maxSteering: 0.38
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

const sun = new Entity('sun');
sun.addComponent('light', {
  type: 'directional',
  color: new Color(1, 0.96, 0.88),
  intensity: 1.35,
  castShadows: true,
  shadowDistance: 120,
  shadowResolution: 2048
});
sun.setEulerAngles(48, 25, 0);
app.root.addChild(sun);

const camera = new Entity('camera');
camera.addComponent('camera', { fov: 72, farClip: 600, clearColor: new Color(0.45, 0.55, 0.75) });
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
