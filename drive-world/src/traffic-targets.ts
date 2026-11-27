import { forEachAmbientTrafficPosition } from './build-world-extras';
import { forEachFreewayDronePosition } from './freeway-traffic-drones';
import { forEachHubTrafficPosition } from './hub-street-traffic';
import type { NearMissTarget } from './near-miss-boost';

export function gatherTrafficTargets(): NearMissTarget[] {
  const out: NearMissTarget[] = [];
  const push = (x: number, z: number, key: string) => out.push({ x, z, key });
  forEachAmbientTrafficPosition(push);
  forEachHubTrafficPosition(push);
  forEachFreewayDronePosition(push);
  return out;
}