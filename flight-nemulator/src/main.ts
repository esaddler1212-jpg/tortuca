import {
  AppBase,
  AppOptions,
  BinaryHandler,
  CameraComponentSystem,
  Color,
  ContainerHandler,
  Entity,
  FILLMODE_FILL_WINDOW,
  Keyboard,
  LightComponentSystem,
  RenderComponentSystem,
  RenderHandler,
  RESOLUTION_AUTO,
  TextureHandler,
  createGraphicsDevice
} from 'playcanvas';
import { mountHud } from './hud/mount';
import { startGame } from './game-loop';
import { refreshLoadingTips, currentLoadingTip } from './loading-tips';

function waitForTap(): Promise<void> {
  const el = document.getElementById('tap-start');
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    const go = () => {
      el.classList.add('hidden');
      resolve();
    };
    el.addEventListener('click', go, { once: true });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') go();
    });
  });
}

mountHud();
void refreshLoadingTips();
const tapSub = document.querySelector('.tap-start-sub');
if (tapSub) {
  const refresh = () => {
    tapSub.textContent = currentLoadingTip().slice(0, 140);
  };
  refresh();
  window.setInterval(refresh, 8000);
}

const canvas = document.getElementById('application-canvas') as HTMLCanvasElement;
await waitForTap();

const device = await createGraphicsDevice(canvas, {
  antialias: false,
  powerPreference: 'high-performance'
});

const options = new AppOptions();
options.graphicsDevice = device;
options.keyboard = new Keyboard(window);
options.componentSystems = [RenderComponentSystem, CameraComponentSystem, LightComponentSystem];
options.resourceHandlers = [RenderHandler, TextureHandler, BinaryHandler, ContainerHandler];

const app = new AppBase(canvas);
app.init(options);

const sun = new Entity('sun');
sun.addComponent('light', {
  type: 'directional',
  color: new Color(1, 0.95, 0.88),
  intensity: 1.1,
  castShadows: false
});
sun.setEulerAngles(50, 30, 0);
app.root.addChild(sun);

app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);

await startGame(app, canvas);
