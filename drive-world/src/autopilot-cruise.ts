import { Vec3, type Entity } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import { CRUISE_VISTAS } from './cruise-vistas';
import { FREEWAY_101, FREEWAY_24, FREEWAY_280, FREEWAY_880, FREEWAY_I80 } from './world-config';

export type AutopilotPreset = 'tour' | 'chill' | 'scenic';

const PRESET_SPEED: Record<AutopilotPreset, number> = {
  tour: 34,
  chill: 11,
  scenic: 18
};

export type CruisePathPoint = { x: number; z: number; y?: number };

function sampleY(p: CruisePathPoint): number {
  const deck = p.y ?? 0;
  return Math.max(hillOffsetM(p.x, p.z), deck) + 1.05;
}

function pushRoute(out: CruisePathPoint[], pts: { x: number; z: number; y?: number }[]): void {
  for (const p of pts) {
    const last = out[out.length - 1];
    if (last && Math.hypot(last.x - p.x, last.z - p.z) < 8) continue;
    out.push({ x: p.x, z: p.z, y: p.y });
  }
}

/** Overnight loop — freeways around the full compressed bay. */
export function buildAutopilotBayLoop(): CruisePathPoint[] {
  const path: CruisePathPoint[] = [];
  path.push({ x: 560, z: 920 });
  pushRoute(
    path,
    [...FREEWAY_I80].reverse().map((p) => ({ x: p.x, z: p.z, y: p.y }))
  );
  pushRoute(path, FREEWAY_101.slice(1, 6));
  pushRoute(path, FREEWAY_280.slice(1));
  pushRoute(path, FREEWAY_880.slice(0, 6));
  pushRoute(path, FREEWAY_I80.slice(5, 11));
  pushRoute(path, FREEWAY_24);
  pushRoute(path, FREEWAY_I80.slice(10));
  path.push({ x: 560, z: 920 });
  return path;
}

export type AutopilotCruise = {
  path: CruisePathPoint[];
  seg: number;
  segT: number;
  speedMps: number;
  loop: boolean;
};

export function buildAutopilotScenicPath(): CruisePathPoint[] {
  const path: CruisePathPoint[] = [];
  for (const v of CRUISE_VISTAS) {
    path.push({ x: v.x, z: v.z });
  }
  if (path.length) path.push({ ...path[0]! });
  return path;
}

export function pathForAutopilotPreset(preset: AutopilotPreset): CruisePathPoint[] {
  if (preset === 'scenic') return buildAutopilotScenicPath();
  return buildAutopilotBayLoop();
}

export function createAutopilotCruise(speedMps = 32, path?: CruisePathPoint[]): AutopilotCruise {
  return {
    path: path ?? buildAutopilotBayLoop(),
    seg: 0,
    segT: 0,
    speedMps,
    loop: true
  };
}

export function createAutopilotCruisePreset(preset: AutopilotPreset): AutopilotCruise {
  return createAutopilotCruise(PRESET_SPEED[preset], pathForAutopilotPreset(preset));
}

export function cycleAutopilotPreset(current: AutopilotPreset): AutopilotPreset {
  const order: AutopilotPreset[] = ['chill', 'tour', 'scenic'];
  const i = order.indexOf(current);
  return order[(i + 1) % order.length]!;
}

export function autopilotMph(cruise: AutopilotCruise): number {
  return cruise.speedMps * 2.23694;
}

/** Move entity along path; returns current mph. */
export function stepAutopilotCruise(cruise: AutopilotCruise, ent: Entity, dt: number): number {
  if (cruise.path.length < 2) return 0;
  let { seg, segT } = cruise;

  const advance = (): boolean => {
    seg++;
    segT = 0;
    if (seg >= cruise.path.length - 1) {
      if (cruise.loop) {
        seg = 0;
        return true;
      }
      return false;
    }
    return true;
  };

  const a = cruise.path[seg]!;
  const b = cruise.path[seg + 1]!;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) {
    if (!advance()) return 0;
    return stepAutopilotCruise(cruise, ent, dt);
  }

  const step = cruise.speedMps * dt;
  segT += step / len;
  if (segT >= 1) {
    if (!advance()) {
      cruise.seg = seg;
      cruise.segT = 0;
      return 0;
    }
    cruise.seg = seg;
    cruise.segT = 0;
    return stepAutopilotCruise(cruise, ent, 0);
  }

  const x = a.x + dx * segT;
  const z = a.z + dz * segT;
  const yBlend = a.y !== undefined && b.y !== undefined ? a.y + (b.y - a.y) * segT : undefined;
  const y = sampleY({ x, z, y: yBlend });
  const yaw = (Math.atan2(dx, dz) * 180) / Math.PI;

  ent.setPosition(x, y, z);
  ent.setEulerAngles(0, yaw, 0);
  const rb = ent.rigidbody;
  if (rb) {
    rb.teleport(new Vec3(x, y, z), ent.getRotation());
    rb.linearVelocity = new Vec3(0, 0, 0);
    rb.angularVelocity = new Vec3(0, 0, 0);
  }

  cruise.seg = seg;
  cruise.segT = segT;
  return autopilotMph(cruise);
}

export function snapAutopilotToPath(cruise: AutopilotCruise, ent: Entity): void {
  const p = cruise.path[0];
  if (!p) return;
  const y = sampleY(p);
  ent.setPosition(p.x, y, p.z);
  ent.rigidbody?.teleport(new Vec3(p.x, y, p.z), ent.getRotation());
}
