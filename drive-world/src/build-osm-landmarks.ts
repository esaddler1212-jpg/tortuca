import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { wgs84ToGame } from './geo-anchor';
import { streetDeckY } from './street-utils';

type OsmLandmarkFile = {
  markers?: Array<{ id: string; x?: number; z?: number; lon?: number; lat?: number; label?: string }>;
};

async function loadMarkers(): Promise<OsmLandmarkFile['markers']> {
  try {
    const res = await fetch('./data/osm/landmarks.json', { cache: 'no-cache' });
    if (!res.ok) return [];
    const data = (await res.json()) as OsmLandmarkFile;
    return data.markers ?? [];
  } catch {
    return [];
  }
}

/**
 * Tier 5 — optional offline OSM-derived pins (`public/data/osm/landmarks.json`).
 * No live Overpass at runtime; commit only example + attribution.
 */
export async function placeOsmLandmarkMarkers(app: AppBase): Promise<number> {
  const markers = (await loadMarkers()) ?? [];
  if (markers.length === 0) return 0;

  const mat = new StandardMaterial();
  mat.diffuse = new Color(0.35, 0.75, 0.95);
  mat.emissive = new Color(0.2, 0.55, 0.85);
  mat.emissiveIntensity = 0.6;
  mat.update();

  const root = new Entity('osm-landmark-root');
  app.root.addChild(root);

  let placed = 0;
  for (const m of markers) {
    const xz =
      m.x != null && m.z != null
        ? { x: m.x, z: m.z }
        : m.lon != null && m.lat != null
          ? wgs84ToGame(m.lon, m.lat)
          : null;
    if (!xz) continue;

    const pole = new Entity(`osm-marker-${m.id}`);
    pole.addComponent('render', { type: 'cylinder' });
    pole.setLocalScale(2.5, 12, 2.5);
    const y = streetDeckY(xz.x, xz.z);
    pole.setLocalPosition(xz.x, y + 6, xz.z);
    pole.render!.material = mat;
    root.addChild(pole);
    placed++;
  }
  return placed;
}