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
  WasmModule,
  createGraphicsDevice
} from 'playcanvas';

import { buildDrivingWorld } from './build-world';
import { startGameSession } from './game-loop';
import { NIGHT_AMBIENT, NIGHT_SKY } from './night-palette';
import { WORLD_HALF_M } from './world-config';

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
app.scene.fogStart = 60;
app.scene.fogEnd = Math.min(2200, WORLD_HALF_M * 0.85);

buildDrivingWorld(app);

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
  farClip: 3600,
  clearColor: NIGHT_SKY.clone()
});
app.root.addChild(camera);

startGameSession(app, speedEl);
