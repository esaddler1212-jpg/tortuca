import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { TACO_TRUCKS } from './city-taco-trucks';
import { hillOffsetM } from './bay-terrain';

export function buildTacoTrucks(app: AppBase): void {
  const bodyMat = new StandardMaterial();
  bodyMat.diffuse = new Color(0.95, 0.55, 0.12);
  bodyMat.emissive = new Color(0.9, 0.35, 0.08);
  bodyMat.emissiveIntensity = 0.35;
  bodyMat.update();

  const cabMat = new StandardMaterial();
  cabMat.diffuse = new Color(0.12, 0.14, 0.16);
  cabMat.update();

  const awningMat = new StandardMaterial();
  awningMat.emissive = new Color(0.2, 0.85, 0.55);
  awningMat.emissiveIntensity = 0.65;
  awningMat.update();

  for (const truck of TACO_TRUCKS) {
    const y = hillOffsetM(truck.x, truck.z);
    const root = new Entity(`taco-truck-${truck.district}`);
    root.setPosition(truck.x, y, truck.z);

    const body = new Entity('body');
    body.setLocalScale(5.5, 2.8, 3.2);
    body.setPosition(0, 1.6, 0);
    body.addComponent('render', { type: 'box', material: bodyMat });
    root.addChild(body);

    const cab = new Entity('cab');
    cab.setLocalScale(2.2, 2.6, 2.4);
    cab.setPosition(-2.8, 1.5, 0);
    cab.addComponent('render', { type: 'box', material: cabMat });
    root.addChild(cab);

    const awning = new Entity('awning');
    awning.setLocalScale(4.8, 0.25, 2.6);
    awning.setPosition(0.6, 3.2, 0);
    awning.addComponent('render', { type: 'box', material: awningMat });
    root.addChild(awning);

    const light = new Entity('glow');
    light.setPosition(0, 3.8, 0);
    light.addComponent('light', {
      type: 'point',
      color: new Color(1, 0.7, 0.35),
      intensity: 1.6,
      range: 42,
      castShadows: false
    });
    root.addChild(light);

    app.root.addChild(root);
  }
}
