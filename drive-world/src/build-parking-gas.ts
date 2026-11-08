import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { GAS_STATIONS } from './gas-stations';
import { LANDMARK_PARKING } from './landmark-parking';
import { hillOffsetM } from './bay-terrain';

export function buildParkingSpots(app: AppBase): void {
  const lineMat = new StandardMaterial();
  lineMat.emissive = new Color(0.15, 0.85, 0.55);
  lineMat.emissiveIntensity = 0.55;
  lineMat.update();

  const postMat = new StandardMaterial();
  postMat.emissive = new Color(0.95, 0.92, 0.4);
  postMat.emissiveIntensity = 0.5;
  postMat.update();

  for (const spot of LANDMARK_PARKING) {
    const y = hillOffsetM(spot.x, spot.z);
    const root = new Entity(`parking-${spot.id}`);
    root.setPosition(spot.x, y + 0.08, spot.z);
    root.setEulerAngles(0, spot.headingDeg, 0);

    const pad = new Entity('pad');
    pad.setLocalScale(spot.lengthM, 0.12, spot.widthM);
    pad.setLocalPosition(0, 0, 0);
    pad.addComponent('render', { type: 'box', material: lineMat });
    root.addChild(pad);

    for (const side of [-1, 1]) {
      const post = new Entity('post');
      post.setLocalScale(0.25, 1.2, 0.25);
      post.setLocalPosition(side * (spot.widthM * 0.5 + 0.2), 0.6, spot.lengthM * 0.42);
      post.addComponent('render', { type: 'box', material: postMat });
      root.addChild(post);
    }

    app.root.addChild(root);
  }
}

export function buildGasStations(app: AppBase): void {
  const canopyMat = new StandardMaterial();
  canopyMat.diffuse = new Color(0.12, 0.14, 0.16);
  canopyMat.emissive = new Color(0.2, 0.55, 0.95);
  canopyMat.emissiveIntensity = 0.4;
  canopyMat.update();

  const pumpMat = new StandardMaterial();
  pumpMat.emissive = new Color(0.2, 0.9, 0.35);
  pumpMat.emissiveIntensity = 0.65;
  pumpMat.update();

  for (const gas of GAS_STATIONS) {
    const y = hillOffsetM(gas.x, gas.z);
    const root = new Entity(gas.id);
    root.setPosition(gas.x, y, gas.z);

    const canopy = new Entity('canopy');
    canopy.setLocalScale(8, 0.3, 6);
    canopy.setLocalPosition(0, 3.2, 0);
    canopy.addComponent('render', { type: 'box', material: canopyMat });
    root.addChild(canopy);

    for (const ox of [-1.6, 1.6]) {
      const pump = new Entity('pump');
      pump.setLocalScale(0.9, 2, 0.7);
      pump.setLocalPosition(ox, 1.1, 0);
      pump.addComponent('render', { type: 'box', material: pumpMat });
      root.addChild(pump);
    }

    const light = new Entity('pump-light');
    light.setPosition(0, 3.6, 0);
    light.addComponent('light', {
      type: 'point',
      color: new Color(0.4, 0.85, 1),
      intensity: 1.2,
      range: 28,
      castShadows: false
    });
    root.addChild(light);

    app.root.addChild(root);
  }
}
