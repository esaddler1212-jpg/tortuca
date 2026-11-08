import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';
import { attachUnitBox } from './primitive-mesh';

/** How a character stays airborne in the flight sandbox. */
export type AerialMobility =
  | 'native'
  | 'tech'
  | 'ring'
  | 'ki'
  | 'magnet'
  | 'jetpack'
  | 'glide'
  | 'web-swing';

export const AERIAL_LABELS: Record<AerialMobility, string> = {
  native: 'Innate flight',
  tech: 'Suit thrusters',
  ring: 'Construct flight',
  ki: 'Ki hover',
  magnet: 'Magnetic levitation',
  jetpack: 'Jetpack rig',
  glide: 'Glider cape',
  'web-swing': 'Web-zip lines'
};

export function aerialHudLabel(mode: AerialMobility): string {
  return AERIAL_LABELS[mode];
}

export function needsFlightAssistVisual(mode: AerialMobility): boolean {
  return mode === 'jetpack';
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

const ASSIST_NAMES = new Set(['flight-assist-jetpack', 'glider-fin']);

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
  else if (mode === 'glide') attachGliderFins(app, parent, tint);
}
