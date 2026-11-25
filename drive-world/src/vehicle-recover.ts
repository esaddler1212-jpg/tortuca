import { Vec3, type Entity } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import { isInTokyo, tokyoGroundHeightM } from './tokyo-map';

function driveFloorY(x: number, z: number): number {
  return (isInTokyo(x, z) ? tokyoGroundHeightM(x, z) : hillOffsetM(x, z)) + 0.55;
}

type AmmoVehicle = {
  vehicle?: {
    getNumWheels: () => number;
    getWheelInfo: (i: number) => { get_m_raycastInfo: () => { get_m_isInContact: () => boolean } };
  };
};

/** Raycast vehicle wheels with ground contact (Ammo btRaycastVehicle). */
export function countWheelsOnGround(ent: Entity): number {
  const vs = (ent.script as unknown as Record<string, unknown> | undefined)?.vehicle as AmmoVehicle | undefined;
  if (!vs?.vehicle) return 0;
  const n = vs.vehicle.getNumWheels();
  let c = 0;
  for (let i = 0; i < n; i++) {
    try {
      const ray = vs.vehicle.getWheelInfo(i)?.get_m_raycastInfo?.();
      if (ray?.get_m_isInContact?.()) c++;
    } catch {
      /* Ammo wheel state can be incomplete right after teleport / Tokyo load */
    }
  }
  return c;
}

export function recoverVehiclePose(ent: Entity): void {
  const pos = ent.getPosition();
  const y = driveFloorY(pos.x, pos.z);
  ent.setPosition(pos.x, y, pos.z);
  ent.setEulerAngles(0, ent.getEulerAngles().y, 0);
  const rb = ent.rigidbody;
  if (rb) {
    rb.linearVelocity = Vec3.ZERO;
    rb.angularVelocity = Vec3.ZERO;
    rb.activate();
  }
}
