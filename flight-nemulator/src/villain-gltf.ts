import { Color, StandardMaterial, type AppBase, type Asset, type Entity } from 'playcanvas';
import { glbPathForVillain } from './villain-gltf-paths';

const loaded = new Map<string, Asset>();
const missing = new Set<string>();

function loadUrl(app: AppBase, url: string): Promise<Asset | null> {
  if (missing.has(url)) return Promise.resolve(null);
  if (loaded.has(url)) return Promise.resolve(loaded.get(url)!);
  return new Promise((resolve) => {
    app.assets.loadFromUrl(url, 'container', (err, asset) => {
      if (err || !asset) {
        missing.add(url);
        resolve(null);
        return;
      }
      loaded.set(url, asset);
      resolve(asset);
    });
  });
}

function tintMeshes(root: Entity, color: [number, number, number]): void {
  const stack: Entity[] = [root];
  while (stack.length) {
    const e = stack.pop()!;
    const instances = e.render?.meshInstances;
    if (instances) {
      for (const mi of instances) {
        const src = mi.material;
        if (!(src instanceof StandardMaterial)) continue;
        const m = src.clone() as StandardMaterial;
        m.diffuse = new Color(color[0], color[1], color[2]);
        m.emissive = new Color(color[0] * 0.35, color[1] * 0.25, color[2] * 0.45);
        m.update();
        mi.material = m;
      }
    }
    for (let i = 0; i < e.children.length; i++) stack.push(e.children[i] as Entity);
  }
}

/** Attach bundled GLB when available; keeps procedural box otherwise. */
export async function attachVillainGltf(
  app: AppBase,
  parent: Entity,
  villainId: string,
  color: [number, number, number],
  entityScale: [number, number, number]
): Promise<boolean> {
  const path = glbPathForVillain(villainId);
  if (!path) return false;
  const asset = await loadUrl(app, path);
  if (!asset?.resource) return false;

  const resource = asset.resource as {
    instantiateRenderEntity?: (o?: object) => Entity;
  };
  const visual = resource.instantiateRenderEntity?.({ castShadows: true, receiveShadows: true });
  if (!visual) return false;

  visual.name = 'villain-gltf';
  const s = Math.min(entityScale[0], entityScale[1], entityScale[2]) * 0.42;
  visual.setLocalScale(s, s * 1.05, s);
  visual.setLocalPosition(0, -entityScale[1] * 0.38, 0);
  parent.addChild(visual);
  tintMeshes(visual, color);

  if (parent.render) parent.removeComponent('render');
  return true;
}
