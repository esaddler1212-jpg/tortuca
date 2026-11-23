/** SFO ⇄ Haneda cinematic: takeoff leg, fade, landing leg at the destination pad. */
import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

export const FLIGHT_LEG1_SEC = 6;
export const FLIGHT_LEG2_SEC = 5;
export const FLIGHT_TOTAL_SEC = FLIGHT_LEG1_SEC + FLIGHT_LEG2_SEC;
export const TOKYO_FOG = new Color(0.09, 0.05, 0.14);

export type FlightRun = {
  dir: 'toTokyo' | 'toBay';
  t: number;
  plane: Entity;
  arrived: boolean;
  from: { x: number; z: number; yaw: number; departYaw: number };
  to: { x: number; z: number; yaw: number; arriveYaw: number };
};

/** PlayCanvas forward is −Z rotated by yaw. */
export function forwardFromYaw(yawDeg: number): { x: number; z: number } {
  const r = (yawDeg * Math.PI) / 180;
  return { x: -Math.sin(r), z: -Math.cos(r) };
}

function m(diffuse: [number, number, number], emissive?: [number, number, number], intensity = 0.8): StandardMaterial {
  const mat = new StandardMaterial();
  mat.diffuse = new Color(...diffuse);
  if (emissive) {
    mat.emissive = new Color(...emissive);
    mat.emissiveIntensity = intensity;
  }
  mat.update();
  return mat;
}

export function createFlightPlane(app: AppBase): Entity {
  const plane = new Entity('tokyo-flight-plane');
  const body = m([0.8, 0.82, 0.86], [0.35, 0.38, 0.45], 0.25);
  const part = (name: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, mat: StandardMaterial) => {
    const e = new Entity(name);
    e.setLocalPosition(x, y, z);
    e.setLocalScale(sx, sy, sz);
    e.addComponent('render', { type: 'box', material: mat });
    plane.addChild(e);
  };
  part('fuselage', 0, 0, 0, 4, 4, 34, body);
  part('wing', 0, -0.6, 1, 36, 0.6, 7, body);
  part('tail-v', 0, 3.5, 15, 0.6, 7, 5, body);
  part('tail-h', 0, 1.2, 15.5, 12, 0.5, 3.5, body);
  part('nav-left', -18, -0.6, 1, 0.8, 0.8, 0.8, m([0.4, 0, 0], [1, 0.05, 0.05], 1.4));
  part('nav-right', 18, -0.6, 1, 0.8, 0.8, 0.8, m([0, 0.4, 0], [0.05, 1, 0.2], 1.4));
  part('cabin-lights', 2.05, 0.6, -2, 0.1, 0.6, 24, m([0.3, 0.25, 0.15], [1, 0.85, 0.5], 1));
  app.root.addChild(plane);
  return plane;
}

export function flightPose(run: FlightRun): {
  pos: Vec3;
  eye: Vec3;
  dir: { x: number; z: number };
  climb: number;
  mph: number;
  fade: number;
} {
  const fade = Math.max(0, Math.min(1, 1 - Math.abs(run.t - FLIGHT_LEG1_SEC) / 0.7));
  let pos: Vec3;
  let dir: { x: number; z: number };
  let speed: number;
  let climb: number;
  if (run.t < FLIGHT_LEG1_SEC) {
    const s = run.t;
    dir = forwardFromYaw(run.from.departYaw);
    const dist = 5 * s * s;
    const lift = Math.max(0, s - 2);
    pos = new Vec3(run.from.x + dir.x * dist, 3 + s * 2.5 + lift * lift * 4, run.from.z + dir.z * dist);
    speed = 10 * s;
    climb = lift > 0 ? 0.18 : 0;
  } else {
    const u = Math.min(run.t - FLIGHT_LEG1_SEC, FLIGHT_LEG2_SEC);
    const k = 1 - u / FLIGHT_LEG2_SEC;
    dir = forwardFromYaw(run.to.arriveYaw);
    const back = 360 * k;
    pos = new Vec3(run.to.x - dir.x * back, 2 + 70 * k * k, run.to.z - dir.z * back);
    speed = 20 + 60 * k;
    climb = -0.12 * k;
  }
  const side = { x: -dir.z, z: dir.x };
  const eye = new Vec3(pos.x - dir.x * 70 + side.x * 26, pos.y + 22, pos.z - dir.z * 70 + side.z * 26);
  return { pos, eye, dir, climb, mph: speed * 2.237, fade };
}
