import { CITY_HUBS, HUB_CONNECTORS, LANDMARK_STREET_ROUTES, pointsForLandmarks, type CityHub } from './city-map-registry';
import { distToSegment } from './street-utils';
import { NAMED_STREETS } from './street-registry';

export type HubCrossing = {
  hubId: string;
  /** North–south street through hub center */
  northSouth: string;
  /** East–west street through hub center */
  eastWest: string;
};

/** Main intersection names per city hub (from regional street maps). */
export const HUB_MAIN_CROSSING: HubCrossing[] = [
  { hubId: 'sf-downtown', northSouth: '3rd St', eastWest: 'Market St' },
  { hubId: 'sf-north-beach', northSouth: 'Columbus Ave', eastWest: 'Lombard St' },
  { hubId: 'marin-bridge', northSouth: 'Conzelman Rd', eastWest: 'Alexander Ave' },
  { hubId: 'marin-sausalito', northSouth: 'Bridgeway', eastWest: 'Princess St' },
  { hubId: 'oakland-lake', northSouth: 'Broadway', eastWest: '14th St' },
  { hubId: 'berkeley-campus', northSouth: 'Telegraph Ave', eastWest: 'Durant Ave' },
  { hubId: 'emeryville', northSouth: 'Christie St', eastWest: 'Bay St' },
  { hubId: 'lamorinda', northSouth: 'Tunnel Rd', eastWest: 'Camino Pablo' },
  { hubId: 'concord-wc', northSouth: 'N Broadway', eastWest: 'Mt Diablo Blvd' },
  { hubId: 'martinez', northSouth: 'Marina Vista Ave', eastWest: 'Court St' },
  { hubId: 'vallejo-harbor', northSouth: 'Sonoma Blvd', eastWest: 'Tennessee St' },
  { hubId: 'napa-town', northSouth: 'Main St', eastWest: '1st St' },
  { hubId: 'peninsula-mid', northSouth: 'Sand Hill Rd', eastWest: 'El Camino Real' },
  { hubId: 'peninsula-sfo', northSouth: 'N Access Rd', eastWest: 'S Airport Blvd' },
  { hubId: 'sj-downtown', northSouth: '1st St', eastWest: 'Santa Clara St' },
  { hubId: 'silicon-valley', northSouth: 'De Anza Blvd', eastWest: 'Stevens Creek Blvd' }
];

export type LabeledStreetSegment = {
  label: string;
  ax: number;
  az: number;
  bx: number;
  bz: number;
  halfWidth: number;
};

function pushPolyline(out: LabeledStreetSegment[], label: string, points: { x: number; z: number }[], halfWidth: number) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    out.push({ label, ax: a.x, az: a.z, bx: b.x, bz: b.z, halfWidth });
  }
}

function crossingStub(
  hub: CityHub,
  crossing: HubCrossing
): LabeledStreetSegment[] {
  const len = Math.min(hub.radiusM * 0.85, 120);
  const hw = 9;
  return [
    {
      label: crossing.northSouth,
      ax: hub.centerX,
      az: hub.centerZ - len,
      bx: hub.centerX,
      bz: hub.centerZ + len,
      halfWidth: hw
    },
    {
      label: crossing.eastWest,
      ax: hub.centerX - len,
      az: hub.centerZ,
      bx: hub.centerX + len,
      bz: hub.centerZ,
      halfWidth: hw
    }
  ];
}

let cached: LabeledStreetSegment[] | null = null;

export function allLabeledStreetSegments(): LabeledStreetSegment[] {
  if (cached) return cached;
  const out: LabeledStreetSegment[] = [];

  for (const street of NAMED_STREETS) {
    const hw = (street.width ?? 18) * 0.5;
    pushPolyline(out, street.label, street.points, hw);
  }

  for (const route of LANDMARK_STREET_ROUTES) {
    if (route.landmarkIds.length < 2) continue;
    const pts = pointsForLandmarks(route.landmarkIds);
    pushPolyline(out, route.label, pts, (route.width ?? 16) * 0.5);
  }

  for (const conn of HUB_CONNECTORS) {
    if (conn.points.length < 2) continue;
    const label = conn.id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    pushPolyline(out, label, conn.points, 8);
  }

  const crossingByHub = new Map(HUB_MAIN_CROSSING.map((c) => [c.hubId, c]));
  for (const hub of CITY_HUBS) {
    const cross = crossingByHub.get(hub.id);
    if (cross) out.push(...crossingStub(hub, cross));
  }

  cached = out;
  return out;
}

export function nearestStreetLabel(x: number, z: number): string | null {
  let best: { label: string; d: number } | null = null;
  for (const seg of allLabeledStreetSegments()) {
    const d = distToSegment(x, z, seg.ax, seg.az, seg.bx, seg.bz);
    if (d > seg.halfWidth + 10) continue;
    if (!best || d < best.d) best = { label: seg.label, d };
  }
  return best?.label ?? null;
}

export function crossingForHub(hubId: string): HubCrossing | undefined {
  return HUB_MAIN_CROSSING.find((c) => c.hubId === hubId);
}
