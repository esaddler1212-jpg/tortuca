import { Color, StandardMaterial, type AppBase, type Asset, type Entity } from 'playcanvas';
import { glbPathForHero } from './hero-gltf-paths';

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

export async function ensureHeroModelLoaded(app: AppBase, heroId: string): Promise<boolean> {
  const url = glbPathForHero(heroId);
  const asset = await loadUrl(app, url);
  return Boolean(asset?.resource);
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
        m.emissive = new Color(color[0] * 0.2, color[1] * 0.2, color[2] * 0.2);
        m.update();
        mi.material = m;
      }
    }
    for (let i = 0; i < e.children.length; i++) stack.push(e.children[i] as Entity);
  }
}

/** Returns glTF visual entity or null — keeps procedural box if missing. */
export async function attachHeroGltf(
  app: AppBase,
  parent: Entity,
  heroId: string,
  color: [number, number, number]
): Promise<Entity | null> {
  const url = glbPathForHero(heroId);
  const asset = await loadUrl(app, url);
  if (!asset?.resource) return null;

  const resource = asset.resource as {
    instantiateRenderEntity?: (o?: object) => Entity;
  };
  const visual = resource.instantiateRenderEntity?.({ castShadows: true, receiveShadows: true });
  if (!visual) return null;

  visual.name = 'hero-gltf';
  visual.setLocalScale(1.35, 1.35, 1.35);
  visual.setLocalPosition(0, -0.9, 0);
  parent.addChild(visual);
  tintMeshes(visual, color);

  const boxRender = parent.render;
  if (boxRender) parent.removeComponent('render');

  return visual;
}
