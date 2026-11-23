import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';
import { attachUnitBox } from './primitive-mesh';

/** How a character stays airborne in the flight sandbox. */
export type AerialMobility =
  | 'native'
  | 'tech'
  | 'ring'
  | 'ki'
  | 'magnet'
  | 'jetpack'
  | 'foot-boost'
  | 'glide'
  | 'web-swing';

export const AERIAL_LABELS: Record<AerialMobility, string> = {
  native: 'Innate flight',
  tech: 'Suit thrusters',
  ring: 'Construct flight',
  ki: 'Ki hover',
  magnet: 'Magnetic levitation',
  jetpack: 'Jetpack rig',
  'foot-boost': 'Foot rocket boosters',
  glide: 'Glider cape',
  'web-swing': 'Web-zip lines'
};

/** Cyber homage heroes — flight without alt-mode. */
export const FOOT_BOOSTER_HERO_IDS = new Set([
  'chrome-convoy',
  'crimson-ace',
  'nitro-phantom',
  'spectrum-ranger'
]);

export function aerialHudLabel(mode: AerialMobility): string {
  return AERIAL_LABELS[mode];
}

export function needsFlightAssistVisual(mode: AerialMobility): boolean {
  return mode === 'jetpack' || mode === 'foot-boost';
}

export function attachFlightAssist(
  app: AppBase,
  parent: Entity,
  mode: AerialMobility,
  tint: [number, number, number]
): Entity | null {
  if (mode !== 'jetpack') return null;
  const pack = new Entity('flight-assist-jetpack');
  pack.setLocalPosition(0, -0.55, -0.35);
  pack.setLocalScale(0.55, 0.75, 0.35);
  pack.addComponent('render', {
    meshInstances: [
      attachUnitBox(
        app,
        tint[0] * 0.35 + 0.2,
        tint[1] * 0.35 + 0.2,
        tint[2] * 0.35 + 0.22
      )
    ]
  });
  const mat = pack.render?.meshInstances?.[0]?.material as StandardMaterial | undefined;
  if (mat) {
    mat.emissive = new Color(tint[0] * 0.25, tint[1] * 0.45, tint[2] * 0.9);
    mat.update();
  }
  const leftNozzle = new Entity('nozzle-l');
  leftNozzle.setLocalPosition(-0.22, -0.42, -0.12);
  leftNozzle.setLocalScale(0.18, 0.22, 0.18);
  leftNozzle.addComponent('render', { meshInstances: [attachUnitBox(app, 0.35, 0.75, 1)] });
  pack.addChild(leftNozzle);
  const rightNozzle = new Entity('nozzle-r');
  rightNozzle.setLocalPosition(0.22, -0.42, -0.12);
  rightNozzle.setLocalScale(0.18, 0.22, 0.18);
  rightNozzle.addComponent('render', { meshInstances: [attachUnitBox(app, 0.35, 0.75, 1)] });
  pack.addChild(rightNozzle);
  parent.addChild(pack);
  return pack;
}

const FOOT_ROCKET_ASSIST = 'foot-rocket-assist';
const FOOT_NOZZLE_NAMES = new Set(['foot-boost-l', 'foot-boost-r']);

export function attachFootRocketBoosters(
  app: AppBase,
  parent: Entity,
  tint: [number, number, number]
): Entity {
  const rig = new Entity(FOOT_ROCKET_ASSIST);
  const mkNozzle = (name: string, x: number) => {
    const boot = new Entity(name);
    boot.setLocalPosition(x, -1.42, 0.08);
    boot.setLocalScale(0.32, 0.22, 0.45);
    boot.addComponent('render', {
      meshInstances: [
        attachUnitBox(app, tint[0] * 0.55, tint[1] * 0.55, tint[2] * 0.58)
      ]
    });
    const flame = new Entity(`${name}-flame`);
    flame.setLocalPosition(0, -0.18, -0.12);
    flame.setLocalScale(0.14, 0.28, 0.22);
    flame.addComponent('render', { meshInstances: [attachUnitBox(app, 0.35, 0.72, 1)] });
    const fmat = flame.render?.meshInstances?.[0]?.material as StandardMaterial | undefined;
    if (fmat) {
      fmat.emissive = new Color(0.25, 0.62, 1);
      fmat.update();
    }
    boot.addChild(flame);
    rig.addChild(boot);
  };
  mkNozzle('foot-boost-l', -0.38);
  mkNozzle('foot-boost-r', 0.38);
  parent.addChild(rig);
  return rig;
}

/** Brighten foot flames while boost is held. */
export function setFootRocketBoostActive(parent: Entity, active: boolean): void {
  const rig = parent.findByName(FOOT_ROCKET_ASSIST) as Entity | undefined;
  if (!rig) return;
  const boost = active ? 1.35 : 0.55;
  for (const child of rig.children as Entity[]) {
    if (!FOOT_NOZZLE_NAMES.has(child.name)) continue;
    const flame = child.findByName(`${child.name}-flame`) as Entity | undefined;
    const mat = flame?.render?.meshInstances?.[0]?.material as StandardMaterial | undefined;
    if (!mat) continue;
    mat.emissive = new Color(0.35 * boost, 0.75 * boost, 1 * boost);
    mat.update();
  }
}

/** World positions for dual boost trails under the hero. */
export function footRocketTrailPositions(parent: Entity): [Vec3, Vec3] {
  const root = parent.getPosition();
  const left = root
    .clone()
    .add(parent.right.clone().mulScalar(-0.42))
    .add(parent.up.clone().mulScalar(-1.15))
    .add(parent.forward.clone().mulScalar(-0.15));
  const rightPos = root
    .clone()
    .add(parent.right.clone().mulScalar(0.42))
    .add(parent.up.clone().mulScalar(-1.15))
    .add(parent.forward.clone().mulScalar(-0.15));
  return [left, rightPos];
}

export function attachGliderFins(
  app: AppBase,
  parent: Entity,
  tint: [number, number, number]
): void {
  const fin = new Entity('glider-fin');
  fin.setLocalPosition(0, 0.15, -0.55);
  fin.setLocalScale(1.6, 0.08, 0.9);
  fin.addComponent('render', { meshInstances: [attachUnitBox(app, tint[0], tint[1], tint[2])] });
  parent.addChild(fin);
}

const ASSIST_NAMES = new Set(['flight-assist-jetpack', 'glider-fin', FOOT_ROCKET_ASSIST]);

export function clearFlightAssistVisuals(parent: Entity): void {
  for (let i = parent.children.length - 1; i >= 0; i--) {
    const child = parent.children[i];
    if (!ASSIST_NAMES.has(child.name)) continue;
    parent.removeChild(child);
    child.destroy();
  }
}

export function syncFlightAssistVisuals(
  app: AppBase,
  parent: Entity,
  mode: AerialMobility,
  tint: [number, number, number]
): void {
  clearFlightAssistVisuals(parent);
  if (mode === 'jetpack') attachFlightAssist(app, parent, mode, tint);
  else if (mode === 'foot-boost') attachFootRocketBoosters(app, parent, tint);
  else if (mode === 'glide') attachGliderFins(app, parent, tint);
}
