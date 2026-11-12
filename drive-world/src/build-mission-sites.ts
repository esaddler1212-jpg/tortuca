import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { LANDMARKS, SFO_AIRPORT_LOT } from './landmark-registry';
import { homeServicePoint, PRESET_SAFEHOUSES, type DwellingKind, type ResolvedSafehouse } from './safehouse-registry';
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

function buildServiceAccess(app: AppBase, house: ResolvedSafehouse): void {
  const svc = homeServicePoint(house);
  const sy = svc.y;

  if (svc.mode === 'valet') {
    const canopyMat = beaconMat(new Color(0.95, 0.88, 0.72), 0.45);
    const canopy = new Entity(`valet-${house.id}`);
    canopy.setLocalScale(22, 0.5, 14);
    canopy.setPosition(svc.x, sy + 3.2, svc.z);
    canopy.addComponent('render', { type: 'box', material: canopyMat });
    app.root.addChild(canopy);

    const podium = new Entity(`valet-desk-${house.id}`);
    podium.setLocalScale(3.5, 2.8, 2.2);
    podium.setPosition(svc.x - 6, sy + 1.4, svc.z + 2);
    const deskMat = beaconMat(new Color(0.15, 0.18, 0.22), 0.25);
    podium.addComponent('render', { type: 'box', material: deskMat });
    app.root.addChild(podium);

    const curb = new Entity(`valet-curb-${house.id}`);
    curb.setLocalScale(16, 0.35, 8);
    curb.setPosition(svc.x, sy + 0.1, svc.z);
    const curbMat = beaconMat(new Color(0.9, 0.55, 0.2), 0.55);
    curb.addComponent('render', { type: 'box', material: curbMat });
    app.root.addChild(curb);
    return;
  }

  const frameMat = beaconMat(new Color(0.22, 0.22, 0.24), 0.3);
  const door = new Entity(`garage-door-${house.id}`);
  door.setLocalScale(house.kind === 'estate' ? 22 : 14, 9, 1.2);
  door.setPosition(svc.x, sy + 4.5, svc.z);
  door.addComponent('render', { type: 'box', material: frameMat });
  app.root.addChild(door);

  const strip = new Entity(`garage-light-${house.id}`);
  strip.setLocalScale(house.kind === 'estate' ? 20 : 12, 0.4, 0.6);
  strip.setPosition(svc.x, sy + 9.2, svc.z + 0.4);
  const stripMat = beaconMat(BAY_BRIDGE_ORANGE, 0.85);
  strip.addComponent('render', { type: 'box', material: stripMat });
  app.root.addChild(strip);
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
    buildServiceAccess(app, { ...sh, custom: false });
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
    buildServiceAccess(app, { ...sh, custom: false });
    return;
  }

  const condoMat = beaconMat(new Color(0.78, 0.76, 0.72), 0.22);
  const condo = new Entity(`safehouse-${sh.id}`);
  condo.setLocalScale(34, 22, 28);
  condo.setPosition(sh.x, sy + 11, sh.z);
  condo.addComponent('render', { type: 'box', material: condoMat });
  app.root.addChild(condo);
  buildServiceAccess(app, { ...sh, custom: false });
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
