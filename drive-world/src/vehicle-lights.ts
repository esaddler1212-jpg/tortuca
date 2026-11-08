import { Color, Entity, type AppBase } from 'playcanvas';

export type VehicleLights = {
  tailLeft: Entity;
  tailRight: Entity;
  headL: Entity;
  headR: Entity;
  setBrake(on: boolean): void;
};

export function attachVehicleLights(vehicle: Entity, app: AppBase): VehicleLights {
  const headColor = new Color(0.95, 0.92, 0.75);
  const tailOff = new Color(0.4, 0.08, 0.06);
  const tailBrake = new Color(1, 0.15, 0.08);

  const headL = new Entity('head-l');
  headL.setLocalPosition(0.55, 0.55, 1.7);
  headL.addComponent('light', {
    type: 'spot',
    color: headColor,
    intensity: 1.8,
    range: 55,
    innerConeAngle: 35,
    outerConeAngle: 50,
    castShadows: false
  });
  vehicle.addChild(headL);

  const headR = new Entity('head-r');
  headR.setLocalPosition(-0.55, 0.55, 1.7);
  headR.addComponent('light', {
    type: 'spot',
    color: headColor,
    intensity: 1.8,
    range: 55,
    innerConeAngle: 35,
    outerConeAngle: 50,
    castShadows: false
  });
  vehicle.addChild(headR);

  const tailLeft = new Entity('tail-l');
  tailLeft.setLocalPosition(0.5, 0.45, -1.75);
  tailLeft.addComponent('light', {
    type: 'point',
    color: tailOff.clone(),
    intensity: 0.6,
    range: 8,
    castShadows: false
  });
  vehicle.addChild(tailLeft);

  const tailRight = new Entity('tail-r');
  tailRight.setLocalPosition(-0.5, 0.45, -1.75);
  tailRight.addComponent('light', {
    type: 'point',
    color: tailOff.clone(),
    intensity: 0.6,
    range: 8,
    castShadows: false
  });
  vehicle.addChild(tailRight);

  return {
    tailLeft,
    tailRight,
    headL,
    headR,
    setBrake(on: boolean) {
      const c = on ? tailBrake : tailOff;
      const intensity = on ? 2.2 : 0.6;
      for (const t of [tailLeft, tailRight]) {
        const light = t.light;
        if (light) {
          light.color = c;
          light.intensity = intensity;
        }
      }
    }
  };
}
