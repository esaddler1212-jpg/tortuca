import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { LANDMARKS, SFO_AIRPORT_LOT } from './landmark-registry';
import { PRESET_SAFEHOUSES, type DwellingKind } from './safehouse-registry';
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

function buildDwelling(app: AppBase, sh: (typeof PRESET_SAFEHOUSES)[0]): void {
  const sy = hillOffsetM(sh.x, sh.z);
  const kind: DwellingKind = sh.kind;

  if (kind === 'estate') {
    const garageMat = beaconMat(BAY_BRIDGE_ORANGE, 0.65);
    const loftMat = beaconMat(new Color(0.18, 0.16, 0.14), 0.2);
    const neonMat = beaconMat(new Color(0.55, 0.15, 0.95), 0.9);

    const garage = new Entity(`safehouse-${sh.id}`);
    garage.setLocalScale(58, 14, 40);
    garage.setPosition(sh.x, sy + 7, sh.z);
    garage.addComponent('render', { type: 'box', material: garageMat });
    app.root.addChild(garage);

    const loft = new Entity(`safehouse-${sh.id}-loft`);
    loft.setLocalScale(36, 10, 28);
    loft.setPosition(sh.x + 8, sy + 18, sh.z - 6);
    loft.addComponent('render', { type: 'box', material: loftMat });
    app.root.addChild(loft);

    for (let i = -1; i <= 1; i++) {
      const strip = new Entity(`safehouse-${sh.id}-neon-${i}`);
      strip.setLocalScale(50, 0.6, 2.2);
      strip.setPosition(sh.x, sy + 1.2, sh.z + i * 14);
      strip.addComponent('render', { type: 'box', material: neonMat });
      app.root.addChild(strip);
    }

    const safeLight = new Entity('safehouse-light');
    safeLight.setPosition(sh.x, sy + 22, sh.z);
    safeLight.addComponent('light', {
      type: 'point',
      color: new Color(1, 0.55, 0.25),
      intensity: 2.6,
      range: 95,
      castShadows: false
    });
    app.root.addChild(safeLight);
    return;
  }

  if (kind === 'penthouse') {
    const glass = beaconMat(new Color(0.45, 0.82, 1), 0.55);
    const tower = new Entity(`safehouse-${sh.id}`);
    tower.setLocalScale(20, 58, 20);
    tower.setPosition(sh.x, sy + 29, sh.z);
    tower.addComponent('render', { type: 'box', material: glass });
    app.root.addChild(tower);

    const crown = new Entity(`safehouse-${sh.id}-crown`);
    crown.setLocalScale(26, 4, 26);
    crown.setPosition(sh.x, sy + 60, sh.z);
    const crownMat = beaconMat(new Color(1, 0.92, 0.7), 0.35);
    crown.addComponent('render', { type: 'box', material: crownMat });
    app.root.addChild(crown);
    return;
  }

  const condoMat = beaconMat(new Color(0.78, 0.76, 0.72), 0.22);
  const condo = new Entity(`safehouse-${sh.id}`);
  condo.setLocalScale(34, 22, 28);
  condo.setPosition(sh.x, sy + 11, sh.z);
  condo.addComponent('render', { type: 'box', material: condoMat });
  app.root.addChild(condo);
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

  for (const sh of PRESET_SAFEHOUSES) {
    buildDwelling(app, sh);
  }

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
