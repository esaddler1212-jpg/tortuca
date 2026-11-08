import { Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import { pointInCityHub, type CityHub } from './city-map-registry';
import { BAY_WINDOW_LIGHTS, hash2 } from './night-palette';
import { nearHubStreetGrid, tooCloseToFreeway } from './street-utils';
import type { DistrictSpec } from './world-config';

type HubChunkJob = {
  hub: CityHub;
  spec: DistrictSpec;
  materials: StandardMaterial[];
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  blockM: number;
  bx: number;
  bz: number;
  done: boolean;
};

const jobs = new Map<string, HubChunkJob>();
const buildingIds = new Set<string>();

export function hubChunkBuildActive(hubId: string): boolean {
  return buildingIds.has(hubId);
}

export function startHubChunkBuild(
  hub: CityHub,
  spec: DistrictSpec,
  materials: StandardMaterial[]
): void {
  if (jobs.has(hub.id) || buildingIds.has(hub.id)) return;
  const blockM = hub.blockM ?? spec.blockM;
  jobs.set(hub.id, {
    hub,
    spec,
    materials,
    minX: hub.centerX - hub.radiusM,
    maxX: hub.centerX + hub.radiusM,
    minZ: hub.centerZ - hub.radiusM,
    maxZ: hub.centerZ + hub.radiusM,
    blockM,
    bx: hub.centerX - hub.radiusM,
    bz: hub.centerZ - hub.radiusM,
    done: false
  });
  buildingIds.add(hub.id);
}

export function cancelHubChunkBuild(hubId: string): void {
  jobs.delete(hubId);
  buildingIds.delete(hubId);
}

/** Build up to `maxCells` grid cells (each may spawn 1–2 towers). Returns true when hub finished. */
export function tickHubChunkBuild(app: AppBase, hubId: string, maxCells = 10): boolean {
  const job = jobs.get(hubId);
  if (!job || job.done) return true;

  let budget = maxCells;
  while (budget > 0 && job.bz < job.maxZ) {
    const { hub, spec, materials, blockM } = job;
    const bx = job.bx;
    const bz = job.bz;
    const cx = bx + blockM * 0.5;
    const cz = bz + blockM * 0.5;
    job.bx += blockM;
    if (job.bx >= job.maxX) {
      job.bx = job.minX;
      job.bz += blockM;
    }
    budget -= 1;

    if (!pointInCityHub(cx, cz, hub)) continue;
    if (tooCloseToFreeway(cx, cz)) continue;
    if (nearHubStreetGrid(cx, cz, hub)) continue;

    const roll = hash2(cx, cz);
    if (roll < 0.14) continue;

    const count = roll > 0.78 ? 2 : 1;
    for (let t = 0; t < count; t++) {
      const ox = (hash2(cx + t, cz) - 0.5) * (blockM * 0.35);
      const oz = (hash2(cz + t, cx) - 0.5) * (blockM * 0.35);
      const x = cx + ox;
      const z = cz + oz;
      if (!pointInCityHub(x, z, hub)) continue;
      if (nearHubStreetGrid(x, z, hub)) continue;

      const groundY = spec.flat ? hash2(x, z) * 1.2 : hillOffsetM(x, z);
      const footprint = spec.footprintMin + hash2(x, z) * (spec.footprintMax - spec.footprintMin);
      const height = (spec.heightMin + hash2(z, x) * (spec.heightMax - spec.heightMin)) * spec.heightMul;
      const matIndex = Math.floor(hash2(x + height, z) * BAY_WINDOW_LIGHTS.length);

      const tower = new Entity(`${hub.id}-${Math.round(x)}-${Math.round(z)}`);
      tower.setLocalScale(footprint, height, footprint);
      tower.setPosition(x, groundY + height * 0.5, z);
      tower.addComponent('render', { type: 'box', material: materials[matIndex] });
      tower.addComponent('collision', {
        type: 'box',
        halfExtents: new Vec3(footprint / 2, height / 2, footprint / 2)
      });
      tower.addComponent('rigidbody', { type: 'static' });
      app.root.addChild(tower);
    }
  }

  if (job.bz >= job.maxZ) {
    job.done = true;
    jobs.delete(hubId);
    buildingIds.delete(hubId);
    return true;
  }
  return false;
}
