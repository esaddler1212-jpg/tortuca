import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { LANDMARKS, SFO_AIRPORT_LOT, VALLEJO_SAFEHOUSE } from './landmark-registry';
import { BAY_BRIDGE_ORANGE } from './night-palette';
import { hillOffsetM } from './bay-terrain';

function beaconMat(color: Color, intensity: number): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = color;
  m.emissive = color;
  m.emissiveIntensity = intensity;
  m.update();
  return m;
}

export function buildMissionSites(app: AppBase): void {
  const airportMat = beaconMat(new Color(0.2, 0.55, 0.95), 0.5);
  const term = new Entity('sfo-terminal');
  term.setLocalScale(120, 18, 80);
  term.setPosition(SFO_AIRPORT_LOT.x, hillOffsetM(SFO_AIRPORT_LOT.x, SFO_AIRPORT_LOT.z) + 9, SFO_AIRPORT_LOT.z - 30);
  term.addComponent('render', { type: 'box', material: airportMat });
  app.root.addChild(term);

  const lot = new Entity('sfo-rental-lot');
  lot.setLocalScale(140, 0.4, 100);
  lot.setPosition(SFO_AIRPORT_LOT.x, hillOffsetM(SFO_AIRPORT_LOT.x, SFO_AIRPORT_LOT.z) + 0.2, SFO_AIRPORT_LOT.z + 20);
  const lotMat = new StandardMaterial();
  lotMat.diffuse = new Color(0.12, 0.14, 0.16);
  lotMat.gloss = 0.4;
  lotMat.update();
  lot.addComponent('render', { type: 'box', material: lotMat });
  app.root.addChild(lot);

  const safeMat = beaconMat(BAY_BRIDGE_ORANGE, 0.55);
  const safe = new Entity('vallejo-safehouse');
  const sy = hillOffsetM(VALLEJO_SAFEHOUSE.x, VALLEJO_SAFEHOUSE.z);
  safe.setLocalScale(36, 14, 28);
  safe.setPosition(VALLEJO_SAFEHOUSE.x, sy + 7, VALLEJO_SAFEHOUSE.z);
  safe.addComponent('render', { type: 'box', material: safeMat });
  app.root.addChild(safe);

  const safeLight = new Entity('safehouse-light');
  safeLight.setPosition(VALLEJO_SAFEHOUSE.x, sy + 18, VALLEJO_SAFEHOUSE.z);
  safeLight.addComponent('light', {
    type: 'point',
    color: new Color(1, 0.55, 0.25),
    intensity: 2.2,
    range: 85,
    castShadows: false
  });
  app.root.addChild(safeLight);

  const pulseMat = beaconMat(new Color(0.35, 0.85, 1), 0.75);
  for (const lm of LANDMARKS) {
    const y = hillOffsetM(lm.x, lm.z);
    const pole = new Entity(`landmark-beacon-${lm.id}`);
    pole.setLocalScale(2.5, 22, 2.5);
    pole.setPosition(lm.x, y + 11, lm.z);
    pole.addComponent('render', { type: 'box', material: pulseMat });
    app.root.addChild(pole);
  }
}
