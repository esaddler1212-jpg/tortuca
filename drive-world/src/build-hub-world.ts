import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import { CITY_HUBS } from './city-map-registry';
import { STOREFRONT_STRIPS } from './storefront-strips';

export function buildHubParkingLots(app: AppBase): void {
  const bodyMat = new StandardMaterial();
  bodyMat.diffuse = new Color(0.35, 0.38, 0.42);
  bodyMat.emissive = new Color(0.25, 0.55, 0.75);
  bodyMat.emissiveIntensity = 0.25;
  bodyMat.update();

  for (const hub of CITY_HUBS) {
    const y = hillOffsetM(hub.centerX, hub.centerZ);
    const root = new Entity(`hub-parking-${hub.id}`);
    root.setPosition(hub.centerX, y, hub.centerZ);
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + 0.4;
      const r = 22 + (i % 2) * 8;
      const car = new Entity('parked');
      car.setLocalScale(1.5, 0.5, 2.1);
      car.setLocalPosition(Math.sin(ang) * r, 0.35, Math.cos(ang) * r);
      car.setLocalEulerAngles(0, (ang * 180) / Math.PI + 90, 0);
      car.addComponent('render', { type: 'box', material: bodyMat });
      root.addChild(car);
    }
    app.root.addChild(root);
  }
}

export function buildStorefrontSigns(app: AppBase): void {
  const signMat = new StandardMaterial();
  signMat.emissive = new Color(0.85, 0.55, 0.25);
  signMat.emissiveIntensity = 0.55;
  signMat.update();

  for (const strip of STOREFRONT_STRIPS) {
    const y = hillOffsetM(strip.x, strip.z);
    const root = new Entity(`storefront-${strip.id}`);
    root.setPosition(strip.x, y, strip.z);
    strip.shops.forEach((name, i) => {
      const sign = new Entity(name);
      const along = (i - (strip.shops.length - 1) / 2) * 7;
      sign.setLocalScale(5.5, 1.2, 0.35);
      sign.setLocalPosition(along, 2.4, 6);
      sign.addComponent('render', { type: 'box', material: signMat });
      root.addChild(sign);
    });
    app.root.addChild(root);
  }
}
