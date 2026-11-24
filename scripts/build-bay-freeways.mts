#!/usr/bin/env node
/**
 * Offline OSM freeway extract → waypoint JSON (Tier 5). No runtime API.
 * With OVERPASS_URL unset, writes a stub that points maintainers at hand-tuned routes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const outDir = join(root, 'drive-world/data');
const outFile = join(outDir, 'osm-freeways.json');

mkdirSync(outDir, { recursive: true });

const overpass = process.env.OVERPASS_URL?.trim();

if (!overpass) {
  const stub = {
    generatedAt: new Date().toISOString(),
    source: 'stub',
    note: 'Set OVERPASS_URL and re-run to fetch motorway ways; gameplay uses world-config.ts FREEWAY_* until merged.',
    routes: [] as unknown[]
  };
  writeFileSync(outFile, JSON.stringify(stub, null, 2));
  console.log(`wrote stub ${outFile} (no OVERPASS_URL)`);
  process.exit(0);
}

const query = `
[out:json][timeout:60];
way["highway"~"motorway|trunk"](37.25,-122.55,38.05,-121.75);
out geom;
`.trim();

const res = await fetch(overpass, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `data=${encodeURIComponent(query)}`
});

if (!res.ok) {
  console.error(`Overpass HTTP ${res.status}`);
  process.exit(1);
}

const body = (await res.json()) as { elements?: Array<{ id: number; tags?: Record<string, string> }> };
const payload = {
  generatedAt: new Date().toISOString(),
  source: 'openstreetmap',
  attribution: '© OpenStreetMap contributors',
  elementCount: body.elements?.length ?? 0,
  elements: body.elements ?? []
};

writeFileSync(outFile, JSON.stringify(payload, null, 2));
console.log(`wrote ${outFile} (${payload.elementCount} elements)`);