import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import { DRAG_STRIPS, DRIFT_PADS, TIME_ATTACKS } from './cpm-challenges';

export function buildCpmChallengePads(app: AppBase): void {
  const driftMat = new StandardMaterial();
  driftMat.emissive = new Color(0.85, 0.25, 0.75);
  driftMat.emissiveIntensity = 0.55;
  driftMat.update();

  const dragMat = new StandardMaterial();
  dragMat.emissive = new Color(0.95, 0.75, 0.2);
  dragMat.emissiveIntensity = 0.65;
  dragMat.update();

  const gateMat = new StandardMaterial();
  gateMat.emissive = new Color(0.35, 0.85, 0.95);
  gateMat.emissiveIntensity = 0.7;
  gateMat.update();

  for (const pad of DRIFT_PADS) {
    const y = hillOffsetM(pad.x, pad.z);
    const root = new Entity(`drift-${pad.id}`);
    root.setPosition(pad.x, y + 0.05, pad.z);
    const ring = new Entity('ring');
    ring.setLocalScale(pad.radius * 2, 0.15, pad.radius * 2);
    ring.addComponent('render', { type: 'cylinder', material: driftMat });
    root.addChild(ring);
    app.root.addChild(root);
  }

  for (const strip of DRAG_STRIPS) {
    const y = hillOffsetM(strip.startX, strip.startZ);
    const len = Math.hypot(strip.endX - strip.startX, strip.endZ - strip.startZ);
  const midX = (strip.startX + strip.endX) / 2;
    const root = new Entity(`drag-${strip.id}`);
    root.setPosition(midX, y + 0.08, strip.startZ);
    const lane = new Entity('lane');
    lane.setLocalScale(len, 0.12, strip.gateWidth);
    lane.addComponent('render', { type: 'box', material: dragMat });
    root.addChild(lane);
    for (const gx of [strip.startX, strip.endX]) {
      const tree = new Entity('tree');
      tree.setLocalPosition(gx - midX, 1.2, 0);
      tree.setLocalScale(0.6, 2.4, 0.6);
      tree.addComponent('render', { type: 'box', material: dragMat });
      root.addChild(tree);
    }
    app.root.addChild(root);
  }

  for (const attack of TIME_ATTACKS) {
    attack.gates.forEach((g, i) => {
      const y = hillOffsetM(g.x, g.z);
      const gate = new Entity(`time-${attack.id}-${i}`);
      gate.setPosition(g.x, y + 1.5, g.z);
      gate.setLocalScale(g.radius * 2, 0.2, 1.2);
      gate.addComponent('render', { type: 'box', material: gateMat });
      app.root.addChild(gate);
    });
  }
}
