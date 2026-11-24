import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { DISTRICT_UNIVERSE, UNIVERSE_RIM_RGB } from './battleworld-districts';
import { DISTRICTS } from './districts';

/** Slice 3: universe-colored rim beacons at each district center (orbit / couch read). */
export function buildDistrictRimLights(app: AppBase, root: Entity): void {
  const group = new Entity('district-rim-lights');
  root.addChild(group);

  for (const d of DISTRICTS) {
    const universe = DISTRICT_UNIVERSE[d.id] ?? 'marvel';
    const [r, g, b] = UNIVERSE_RIM_RGB[universe];
    const col = new Color(r, g, b);

    const light = new Entity(`district-rim-light-${d.id}`);
    light.setPosition(d.center.x, 55, d.center.z);
    light.addComponent('light', {
      type: 'point',
      color: col,
      intensity: 2.4,
      range: Math.min(920, d.radiusM * 1.85),
      castShadows: false
    });
    group.addChild(light);

    const beacon = new Entity(`district-rim-beacon-${d.id}`);
    beacon.setPosition(d.center.x, 70, d.center.z);
    beacon.setLocalScale(7, 140 * d.skylineMul * 0.45, 7);
    const mat = new StandardMaterial();
    mat.diffuse = new Color(r * 0.12, g * 0.12, b * 0.12);
    mat.emissive = col.clone();
    mat.emissiveIntensity = 0.65;
    mat.update();
    beacon.addComponent('render', { type: 'box', material: mat });
    group.addChild(beacon);

    const ring = new Entity(`district-rim-pad-${d.id}`);
    ring.setPosition(d.center.x, 1.2, d.center.z);
    ring.setLocalScale(d.radiusM * 0.42, 0.2, d.radiusM * 0.42);
    const ringMat = new StandardMaterial();
    ringMat.diffuse = new Color(0.05, 0.06, 0.08);
    ringMat.emissive = col.clone();
    ringMat.emissiveIntensity = 0.22;
    ringMat.update();
    ring.addComponent('render', { type: 'box', material: ringMat });
    group.addChild(ring);
  }
}