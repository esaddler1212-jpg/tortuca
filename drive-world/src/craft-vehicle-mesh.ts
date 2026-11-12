import { Color, Entity, StandardMaterial } from 'playcanvas';

import type { VehicleCustomization } from './vehicle-customization';
import { DEFAULT_CUSTOMIZATION, appliedTuning } from './vehicle-customization';
import { getVehicleSpec } from './vehicle-catalog';

function mat(rgb: [number, number, number], em: [number, number, number], ei: number): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = new Color(rgb[0], rgb[1], rgb[2]);
  m.emissive = new Color(em[0], em[1], em[2]);
  m.emissiveIntensity = ei;
  m.metalness = 0.55;
  m.gloss = 0.45;
  m.update();
  return m;
}

/** Procedural low-poly bodies (Craft pass — in-repo, CC0-safe). */
export function attachCraftVehicleMesh(
  vehicle: Entity,
  vehicleId: string,
  customization?: VehicleCustomization
): void {
  const spec = getVehicleSpec(vehicleId);
  const tuning = appliedTuning(spec, customization ?? DEFAULT_CUSTOMIZATION);
  const paint = mat(tuning.diffuse, tuning.emissive, tuning.emissiveIntensity);
  const cx = spec.chassis.x;
  const cz = spec.chassis.z;
  const drop = tuning.rideDrop;

  const body = new Entity('craft-body');
  body.setLocalPosition(0, 0.45 - drop, 0);

  if (vehicleId === 'craft-bay-wedge') {
    const shell = new Entity('wedge-shell');
    shell.setLocalScale(cx, 0.32, cz * 0.85);
    shell.setLocalEulerAngles(-12, 0, 0);
    shell.addComponent('render', { type: 'box', material: paint });
    body.addChild(shell);
    const lip = new Entity('wedge-lip');
    const lipM = mat([0.05, 0.06, 0.08], [0.2, 0.85, 0.95], 0.65);
    lip.setLocalScale(cx * 0.92, 0.06, 0.35);
    lip.setLocalPosition(0, 0.08, cz * 0.38);
    lip.addComponent('render', { type: 'box', material: lipM });
    body.addChild(lip);
  } else if (vehicleId === 'craft-night-lift') {
    const cage = new Entity('lift-cage');
    cage.setLocalScale(cx * 0.95, 0.72, cz * 0.92);
    cage.addComponent('render', { type: 'box', material: paint });
    body.addChild(cage);
    const rack = new Entity('lift-rack');
    const rackM = mat([0.08, 0.08, 0.1], [0.95, 0.55, 0.2], 0.5);
    rack.setLocalScale(cx * 0.65, 0.08, cz * 0.55);
    rack.setLocalPosition(0, 0.62, -cz * 0.15);
    rack.addComponent('render', { type: 'box', material: rackM });
    body.addChild(rack);
  } else if (vehicleId === 'craft-street-spike') {
    const deck = new Entity('spike-deck');
    deck.setLocalScale(cx * 1.05, 0.22, cz * 0.75);
    deck.addComponent('render', { type: 'box', material: paint });
    body.addChild(deck);
    for (const side of [-1, 1]) {
      const fin = new Entity('spike-fin');
      const finM = mat([0.04, 0.04, 0.05], [0.95, 0.25, 0.55], 0.58);
      fin.setLocalScale(0.08, 0.42, cz * 0.4);
      fin.setLocalPosition(side * cx * 0.55, 0.18, -cz * 0.12);
      fin.setLocalEulerAngles(0, 0, side * 18);
      fin.addComponent('render', { type: 'box', material: finM });
      body.addChild(fin);
    }
  }

  vehicle.addChild(body);
}
