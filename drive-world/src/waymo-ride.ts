import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import { SFO_AIRPORT_LOT, VALLEJO_SAFEHOUSE } from './landmark-registry';
import { FREEWAY_I80, type FreewayWaypoint } from './world-config';

export type RidePoint = { x: number; z: number; y?: number };

/** SFO rental curb → US-101 → I-80 → Vallejo safehouse. */
export function buildWaymoRidePath(): RidePoint[] {
  const connector: RidePoint[] = [
    { x: SFO_AIRPORT_LOT.x, z: SFO_AIRPORT_LOT.z },
    { x: -500, z: -1245 },
    { x: -620, z: -1200 },
    { x: -740, z: -1020 },
    { x: -800, z: -760 },
    { x: -830, z: -560 }
  ];
  const i80 = FREEWAY_I80.map((p: FreewayWaypoint) => ({ x: p.x, z: p.z, y: p.y }));
  const end: RidePoint[] = [
    { x: VALLEJO_SAFEHOUSE.x, z: VALLEJO_SAFEHOUSE.z + 22 }
  ];
  return [...connector, ...i80, ...end];
}

function sampleY(p: RidePoint): number {
  const deck = p.y ?? 0;
  const ground = hillOffsetM(p.x, p.z);
  return Math.max(ground, deck) + 1.1;
}

export type WaymoRide = {
  root: Entity;
  speedMps: number;
  isActive: boolean;
  currentMph: number;
  update(dt: number): boolean;
  destroy(): void;
};

export function spawnWaymoRide(app: AppBase, path: RidePoint[]): WaymoRide {
  const bodyMat = new StandardMaterial();
  bodyMat.diffuse = new Color(0.92, 0.94, 0.96);
  bodyMat.emissive = new Color(0.45, 0.75, 0.95);
  bodyMat.emissiveIntensity = 0.12;
  bodyMat.gloss = 0.55;
  bodyMat.metalness = 0.25;
  bodyMat.update();

  const domeMat = new StandardMaterial();
  domeMat.diffuse = new Color(0.15, 0.18, 0.22);
  domeMat.emissive = new Color(0.2, 0.85, 0.75);
  domeMat.emissiveIntensity = 0.55;
  domeMat.update();

  const root = new Entity('waymo-ride');
  const body = new Entity('waymo-body');
  body.setLocalScale(1.85, 0.72, 2.35);
  body.setLocalPosition(0, 0.6, 0);
  body.addComponent('render', { type: 'box', material: bodyMat });
  root.addChild(body);

  const dome = new Entity('waymo-lidar');
  dome.setLocalScale(0.55, 0.28, 0.55);
  dome.setLocalPosition(0, 1.12, 0.25);
  dome.addComponent('render', { type: 'cylinder', material: domeMat });
  root.addChild(dome);

  const tag = new Entity('waymo-badge');
  tag.setLocalScale(1.2, 0.25, 0.08);
  tag.setLocalPosition(0, 0.55, 1.22);
  const tagMat = new StandardMaterial();
  tagMat.diffuse = new Color(0.08, 0.55, 0.72);
  tagMat.emissive = new Color(0.1, 0.65, 0.85);
  tagMat.emissiveIntensity = 0.4;
  tagMat.update();
  tag.addComponent('render', { type: 'box', material: tagMat });
  root.addChild(tag);

  const start = path[0];
  root.setPosition(start.x, sampleY(start), start.z);
  app.root.addChild(root);

  let seg = 0;
  let segT = 0;
  const speedMps = 38;

  const ride: WaymoRide = {
    root,
    speedMps,
    isActive: true,
    currentMph: 0,
    update(dt: number) {
      if (!ride.isActive || seg >= path.length - 1) {
        ride.isActive = false;
        ride.currentMph = 0;
        return false;
      }

      const a = path[seg];
      const b = path[seg + 1];
      const ax = a.x;
      const az = a.z;
      const bx = b.x;
      const bz = b.z;
      const dx = bx - ax;
      const dz = bz - az;
      const len = Math.hypot(dx, dz);
      if (len < 0.01) {
        seg++;
        segT = 0;
        return true;
      }

      const step = speedMps * dt;
      segT += step / len;
      ride.currentMph = speedMps * 2.23694;

      if (segT >= 1) {
        segT = 0;
        seg++;
        if (seg >= path.length - 1) {
          const end = path[path.length - 1];
          root.setPosition(end.x, sampleY(end), end.z);
          ride.isActive = false;
          ride.currentMph = 0;
          return false;
        }
        return ride.update(0);
      }

      const x = ax + dx * segT;
      const z = az + dz * segT;
      const y = sampleY({ x, z, y: a.y !== undefined && b.y !== undefined ? a.y + (b.y - a.y) * segT : undefined });
      root.setPosition(x, y, z);
      const yaw = (Math.atan2(dx, dz) * 180) / Math.PI;
      root.setEulerAngles(0, yaw, 0);
      return true;
    },
    destroy() {
      root.destroy();
      ride.isActive = false;
    }
  };

  return ride;
}

export function waymoPassengerCameraOffset(): { offset: Vec3; lookAhead: number } {
  return {
    offset: new Vec3(0.4, 1.35, 0.2),
    lookAhead: 28
  };
}

export type WaymoCinematicShot = { eye: Vec3; look: Vec3 };

/** Prologue: aerial drone → glide → passenger over ~26 s. */
export function waymoCinematicCamera(pos: Vec3, forward: Vec3, rideTimeSec: number): WaymoCinematicShot {
  const passenger = waymoPassengerCameraOffset();
  const passEye = new Vec3(
    pos.x - forward.x * passenger.offset.z + forward.x * 0.15,
    pos.y + passenger.offset.y,
    pos.z - forward.z * passenger.offset.z
  );
  const passLook = new Vec3(
    pos.x + forward.x * passenger.lookAhead,
    pos.y + 0.6,
    pos.z + forward.z * passenger.lookAhead
  );

  const orbit = Math.sin(rideTimeSec * 0.22) * 12;
  const droneH = 72 + Math.sin(rideTimeSec * 0.35) * 6;
  const droneBack = 38 + Math.cos(rideTimeSec * 0.18) * 4;
  const droneEye = new Vec3(
    pos.x - forward.x * droneBack + orbit,
    pos.y + droneH,
    pos.z - forward.z * droneBack
  );
  const droneLook = new Vec3(pos.x + forward.x * 6, pos.y + 2.5, pos.z + forward.z * 6);

  const t0 = 10;
  const t1 = 24;
  if (rideTimeSec < t0) {
    return { eye: droneEye, look: droneLook };
  }
  if (rideTimeSec < t1) {
    const u = (rideTimeSec - t0) / (t1 - t0);
    const ease = u * u * (3 - 2 * u);
    const eye = new Vec3().lerp(droneEye, passEye, ease);
    const look = new Vec3().lerp(droneLook, passLook, ease);
    return { eye, look };
  }
  return { eye: passEye, look: passLook };
}
