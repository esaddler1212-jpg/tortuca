import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';
import { DISTRICTS } from './districts';
import { attachUnitBox } from './primitive-mesh';

export type MonumentSpec = {
  codename: string;
  color: [number, number, number];
  /** all district homes, or one district id */
  scope: 'all' | string;
};

function removeLandmarkEntities(root: Entity, districtId: string): void {
  for (const child of [...root.children]) {
    const n = child.name;
    if (
      n === `home-${districtId}` ||
      n === `pad-${districtId}` ||
      (districtId === 'gotham-nights' && n === 'cave-mouth')
    ) {
      root.removeChild(child);
      child.destroy();
    }
  }
}

function placeStatue(
  app: AppBase,
  root: Entity,
  districtId: string,
  x: number,
  z: number,
  spec: MonumentSpec
): void {
  const pedestal = new Entity(`monument-pedestal-${districtId}`);
  pedestal.setLocalPosition(x, 6, z);
  pedestal.setLocalScale(48, 12, 48);
  pedestal.addComponent('render', {
    meshInstances: [attachUnitBox(app, 0.12, 0.12, 0.14)]
  });
  root.addChild(pedestal);

  const body = new Entity(`monument-${districtId}`);
  const h = districtId === spec.scope || spec.scope === 'all' ? 95 : 70;
  body.setLocalPosition(x, 12 + h / 2, z);
  body.setLocalScale(22, h, 14);
  const [r, g, b] = spec.color;
  body.addComponent('render', {
    meshInstances: [attachUnitBox(app, r, g, b)]
  });
  const mi = body.render?.meshInstances?.[0];
  const mat = mi?.material as StandardMaterial | undefined;
  if (mat) {
    mat.emissive = new Color(r * 0.5, g * 0.5, b * 0.5);
    mat.update();
  }
  root.addChild(body);

  const crown = new Entity(`monument-crown-${districtId}`);
  crown.setLocalPosition(x, 12 + h + 8, z);
  crown.setLocalScale(28, 16, 28);
  crown.addComponent('render', {
    meshInstances: [attachUnitBox(app, r * 0.9, g * 0.9, b * 0.9)]
  });
  root.addChild(crown);
}

/** Villain: statues at every district center; Hero: hometown only. */
export function installMonuments(app: AppBase, root: Entity, spec: MonumentSpec): void {
  const targets =
    spec.scope === 'all' ? DISTRICTS.map((d) => d.id) : [spec.scope];
  for (const id of targets) {
    const d = DISTRICTS.find((x) => x.id === id);
    if (!d) continue;
    removeLandmarkEntities(root, id);
    placeStatue(app, root, id, d.center.x, d.center.z, spec);
  }
}
