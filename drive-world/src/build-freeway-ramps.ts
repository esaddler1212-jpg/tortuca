import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import { FREEWAY_I80, FREEWAY_101, FREEWAY_880, FREEWAY_WIDTH_M } from './world-config';

function rampMat(): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = new Color(0.07, 0.07, 0.075);
  m.gloss = 0.55;
  m.metalness = 0.12;
  m.update();
  return m;
}

function addRampSegment(
  app: AppBase,
  ax: number,
  az: number,
  ay: number,
  bx: number,
  bz: number,
  by: number,
  tag: string
) {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 4) return;

  const mx = (ax + bx) * 0.5;
  const mz = (az + bz) * 0.5;
  const avgDeck = (ay + by) * 0.5;
  const groundY = hillOffsetM(mx, mz);
  const rise = Math.max(0.5, avgDeck - groundY + 0.2);
  const my = groundY + rise * 0.45;
  const angleDeg = (Math.atan2(dx, dz) * 180) / Math.PI;
  const pitch = (-Math.atan2(by - ay, len) * 180) / Math.PI - 4;

  const mat = rampMat();
  const ramp = new Entity(`ramp-${tag}`);
  ramp.setLocalScale(FREEWAY_WIDTH_M + 6, rise, len + 2);
  ramp.setPosition(mx, my, mz);
  ramp.setEulerAngles(pitch, angleDeg, 0);
  ramp.addComponent('render', { type: 'box', material: mat });
  ramp.addComponent('collision', {
    type: 'box',
    halfExtents: new Vec3((FREEWAY_WIDTH_M + 6) / 2, rise / 2, len / 2)
  });
  ramp.addComponent('rigidbody', { type: 'static' });
  app.root.addChild(ramp);
}

/** Grade transitions at major freeway merges (ground ↔ deck). */
export function buildFreewayRamps(app: AppBase): void {
  const junctions: [typeof FREEWAY_I80[0], typeof FREEWAY_I80[0], string][] = [
    [FREEWAY_101[0], FREEWAY_I80[0], 'sf-101-80'],
    [FREEWAY_880[6], FREEWAY_I80[7], 'oak-880-80'],
    [{ x: -520, z: -1240, y: 0 }, FREEWAY_101[3], 'sfo-101']
  ];

  for (const [a, b, tag] of junctions) {
    addRampSegment(app, a.x, a.z, a.y ?? hillOffsetM(a.x, a.z), b.x, b.z, b.y ?? 0, tag);
  }

  const i80Start = FREEWAY_I80[0];
  const gY = hillOffsetM(i80Start.x, i80Start.z);
  if ((i80Start.y ?? 0) > gY + 0.3) {
    addRampSegment(app, i80Start.x - 40, i80Start.z, gY, i80Start.x, i80Start.z, i80Start.y ?? 0, 'i80-west');
  }
}
