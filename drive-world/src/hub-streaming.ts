import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { CITY_HUBS, pointInCityHub, type CityHub } from './city-map-registry';
import { getDistrictMaterials } from './build-districts';
import { startHubChunkBuild, tickHubChunkBuild, hubChunkBuildActive } from './build-hub-chunked';
import { hillOffsetM } from './bay-terrain';
import { DISTRICTS } from './world-config';

/** Hubs along the opening Waymo path + home base. */
const BOOTSTRAP_HUB_IDS = new Set(['peninsula-sfo', 'peninsula-mid', 'sf-downtown', 'vallejo-harbor']);

const builtHubIds = new Set<string>();
const pendingBuildIds = new Set<string>();
const shellRoots = new Map<string, Entity>();

const SHELL_MAT = (() => {
  const m = new StandardMaterial();
  m.diffuse = new Color(0.05, 0.06, 0.09);
  m.emissive = new Color(0.12, 0.22, 0.42);
  m.emissiveIntensity = 0.35;
  m.update();
  return m;
})();

function hubDistance(px: number, pz: number, hub: CityHub): number {
  return Math.hypot(px - hub.centerX, pz - hub.centerZ);
}

function nearestHubs(from: CityHub, count: number): CityHub[] {
  return [...CITY_HUBS]
    .filter((h) => h.id !== from.id)
    .sort((a, b) => hubDistance(from.centerX, from.centerZ, a) - hubDistance(from.centerX, from.centerZ, b))
    .slice(0, count);
}

function ensureHubShell(app: AppBase, hub: CityHub): void {
  if (builtHubIds.has(hub.id) || shellRoots.has(hub.id) || hubChunkBuildActive(hub.id)) return;
  const y = hillOffsetM(hub.centerX, hub.centerZ);
  const root = new Entity(`hub-shell-${hub.id}`);
  root.setPosition(hub.centerX, y, hub.centerZ);
  const ring = hub.radiusM * 0.72;
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const h = 28 + (i % 3) * 14;
    const block = new Entity('shell-tower');
    block.setLocalScale(10, h, 10);
    block.setLocalPosition(Math.sin(ang) * ring, h * 0.5, Math.cos(ang) * ring);
    block.addComponent('render', { type: 'box', material: SHELL_MAT });
    root.addChild(block);
  }
  app.root.addChild(root);
  shellRoots.set(hub.id, root);
}

function destroyHubShell(hubId: string): void {
  shellRoots.get(hubId)?.destroy();
  shellRoots.delete(hubId);
}

function queueHubBuild(hub: CityHub): void {
  if (builtHubIds.has(hub.id) || pendingBuildIds.has(hub.id) || hubChunkBuildActive(hub.id)) return;
  destroyHubShell(hub.id);
  startHubChunkBuild(hub, DISTRICTS[hub.district], getDistrictMaterials());
  pendingBuildIds.add(hub.id);
}

function finishHubBuild(hubId: string): void {
  builtHubIds.add(hubId);
  pendingBuildIds.delete(hubId);
  destroyHubShell(hubId);
}

function drainHubBuild(app: AppBase, hub: CityHub): void {
  queueHubBuild(hub);
  while (hubChunkBuildActive(hub.id)) {
    tickHubChunkBuild(app, hub.id, 48);
  }
  finishHubBuild(hub.id);
}

export function isHubBuilt(hubId: string): boolean {
  return builtHubIds.has(hubId);
}

export function ensureHubBuilt(app: AppBase, hub: CityHub): void {
  if (builtHubIds.has(hub.id)) return;
  drainHubBuild(app, hub);
}

/** Time-sliced hub builds while driving (see `updateHubStreaming`). */
export function tickPendingHubBuilds(app: AppBase, cellsPerFrame = 12): void {
  for (const hubId of [...pendingBuildIds]) {
    const done = tickHubChunkBuild(app, hubId, cellsPerFrame);
    if (done) finishHubBuild(hubId);
  }
}

/** Deferred hub blocks + distant skyline shells (EarthNG tile illusion). */
export function initHubStreaming(app: AppBase, streamingEnabled: boolean): void {
  builtHubIds.clear();
  pendingBuildIds.clear();
  for (const ent of shellRoots.values()) ent.destroy();
  shellRoots.clear();

  if (!streamingEnabled) {
    for (const hub of CITY_HUBS) ensureHubBuilt(app, hub);
    return;
  }

  for (const hub of CITY_HUBS) {
    if (BOOTSTRAP_HUB_IDS.has(hub.id)) drainHubBuild(app, hub);
    else ensureHubShell(app, hub);
  }
}

export function updateHubStreaming(app: AppBase, px: number, pz: number, streamingEnabled: boolean): void {
  if (!streamingEnabled) return;

  const buildRadiusExtra = 520;

  for (const hub of CITY_HUBS) {
    const d = hubDistance(px, pz, hub);
    if (d < hub.radiusM + buildRadiusExtra) queueHubBuild(hub);
  }

  let inside: CityHub | null = null;
  for (const hub of CITY_HUBS) {
    if (pointInCityHub(px, pz, hub)) {
      inside = hub;
      break;
    }
  }
  if (inside) {
    for (const neighbor of nearestHubs(inside, 2)) {
      const d = hubDistance(px, pz, neighbor);
      if (d < neighbor.radiusM + buildRadiusExtra * 1.4) queueHubBuild(neighbor);
      else if (!builtHubIds.has(neighbor.id)) ensureHubShell(app, neighbor);
    }
  }

  tickPendingHubBuilds(app, 12);

  for (const [id, root] of shellRoots) {
    const hub = CITY_HUBS.find((h) => h.id === id);
    if (!hub) continue;
    const d = hubDistance(px, pz, hub);
    root.enabled = d < 1500;
  }
}
