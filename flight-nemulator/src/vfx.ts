import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';
import { attachUnitBox } from './primitive-mesh';

type TrailPuff = { ent: Entity; life: number };

const trails: TrailPuff[] = [];
let shakeAmp = 0;

export function addScreenShake(amount: number): void {
  shakeAmp = Math.min(2.2, shakeAmp + amount);
}

export function consumeShake(): Vec3 {
  if (shakeAmp <= 0.001) return new Vec3();
  const j = shakeAmp;
  shakeAmp *= 0.86;
  return new Vec3((Math.random() - 0.5) * j, (Math.random() - 0.5) * j * 0.4, (Math.random() - 0.5) * j);
}

export function spawnBoostTrail(
  app: AppBase,
  root: Entity,
  pos: Vec3,
  color: [number, number, number]
): void {
  const ent = new Entity('trail');
  ent.setPosition(pos);
  ent.setLocalScale(1.2, 0.4, 2.8);
  ent.addComponent('render', { meshInstances: [attachUnitBox(app, color[0], color[1], color[2])] });
  const mat = ent.render?.meshInstances?.[0]?.material as StandardMaterial | undefined;
  if (mat) {
    mat.emissive = new Color(color[0] * 0.8, color[1] * 0.8, color[2] * 0.8);
    mat.update();
  }
  root.addChild(ent);
  trails.push({ ent, life: 0.35 });
}

export function tickTrails(dt: number, root: Entity): void {
  for (let i = trails.length - 1; i >= 0; i--) {
    const t = trails[i];
    t.life -= dt;
    if (t.life <= 0) {
      root.removeChild(t.ent);
      t.ent.destroy();
      trails.splice(i, 1);
    }
  }
}

export function spawnCraterMarker(app: AppBase, root: Entity, aim: Vec3, radius: number): void {
  const ring = new Entity('crater-ring');
  ring.setPosition(aim.x, 1.5, aim.z);
  ring.setLocalScale(radius * 2, 0.25, radius * 2);
  ring.addComponent('render', { meshInstances: [attachUnitBox(app, 0.95, 0.35, 0.15)] });
  root.addChild(ring);
  trails.push({ ent: ring, life: 4.5 });
}
