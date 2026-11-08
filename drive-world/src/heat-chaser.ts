import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';

let chaser: Entity | null = null;
let flashT = 0;

const CHASER_MAT = (() => {
  const m = new StandardMaterial();
  m.diffuse = new Color(0.12, 0.05, 0.05);
  m.emissive = new Color(0.95, 0.15, 0.1);
  m.emissiveIntensity = 0.85;
  m.update();
  return m;
})();

function ensureChaser(app: AppBase): Entity {
  if (chaser) return chaser;
  const root = new Entity('heat-chaser');
  root.setLocalScale(1.85, 0.65, 2.4);
  root.addComponent('render', { type: 'box', material: CHASER_MAT });
  const bar = new Entity('chaser-bar');
  bar.setLocalScale(1.2, 0.15, 0.15);
  bar.setLocalPosition(0, 0.55, -0.2);
  bar.addComponent('render', { type: 'box', material: CHASER_MAT });
  root.addChild(bar);
  app.root.addChild(root);
  chaser = root;
  return root;
}

export function destroyHeatChaser(): void {
  chaser?.destroy();
  chaser = null;
}

/** Midnight Club–style box unit when speed-trap heat is hunted. */
export function tickHeatChaser(
  app: AppBase,
  enabled: boolean,
  heat: number,
  px: number,
  pz: number,
  py: number,
  yawDeg: number,
  mph: number,
  dt: number
): void {
  if (!enabled || heat < 4) {
    if (chaser) destroyHeatChaser();
    return;
  }
  const ent = ensureChaser(app);
  const yaw = (yawDeg * Math.PI) / 180;
  const tailDist = heat >= 4.8 ? 16 : 24;
  const targetX = px - Math.sin(yaw) * tailDist;
  const targetZ = pz - Math.cos(yaw) * tailDist;
  const cur = ent.getPosition();
  const pull = Math.min(1, dt * (1.8 + heat * 0.35));
  const nx = cur.x + (targetX - cur.x) * pull;
  const nz = cur.z + (targetZ - cur.z) * pull;
  const ny = hillOffsetM(nx, nz) + 0.55;
  ent.setPosition(nx, ny, nz);
  ent.setEulerAngles(0, yawDeg, 0);
  flashT += dt;
  const pulse = 0.75 + Math.sin(flashT * 14) * 0.25;
  ent.setLocalScale(1.85 * pulse, 0.65, 2.4 * pulse);
  if (mph > 60 && heat >= 4.5) {
    const close = Math.hypot(px - nx, pz - nz);
    if (close < 12) {
      ent.setPosition(
        cur.x + Math.sin(yaw) * dt * (28 + mph * 0.15),
        ny,
        cur.z + Math.cos(yaw) * dt * (28 + mph * 0.15)
      );
    }
  }
}
