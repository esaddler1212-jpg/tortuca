import { Color, type AppBase } from 'playcanvas';
import type { QualityTier } from './quality-tier';

/** Poly Haven CC0 — remote equirectangular (no local install). */
const POLYHAVEN_SKY_JPG =
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/jpg/1k/kloofendal_48d_partly_cloudy_puresky_1k.jpg';

export async function applySkyEnvironment(app: AppBase, tier: QualityTier): Promise<void> {
  app.scene.exposure = tier === 'low' ? 0.95 : 1.08;
  app.scene.ambientLight =
    tier === 'low' ? new Color(0.22, 0.24, 0.32) : new Color(0.28, 0.3, 0.38);

  if (tier === 'low') return;

  await new Promise<void>((resolve) => {
    app.assets.loadFromUrl(POLYHAVEN_SKY_JPG, 'texture', (err, asset) => {
      if (!err && asset?.resource) {
        app.scene.skybox = asset.resource;
        app.scene.skyboxIntensity = tier === 'high' ? 1.15 : 0.85;
        app.scene.skyboxMip = 0;
      }
      resolve();
    });
  });
}

/** Optional Open-Meteo cloud code → fog tint (already used in Tortuca Pulse). */
export async function fetchBayWeatherMood(): Promise<{ cloud: number; wind: number } | null> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=37.77&longitude=-122.42&current=cloud_cover,wind_speed_10m'
    );
    if (!res.ok) return null;
    const j = (await res.json()) as { current?: { cloud_cover?: number; wind_speed_10m?: number } };
    const c = j.current;
    if (!c) return null;
    return { cloud: c.cloud_cover ?? 40, wind: c.wind_speed_10m ?? 8 };
  } catch {
    return null;
  }
}

export function applyWeatherMood(app: AppBase, mood: { cloud: number; wind: number } | null): void {
  if (!mood) return;
  const density = Math.min(1, mood.cloud / 100);
  app.scene.fogStart = 80 + density * 120;
  app.scene.fogEnd = 2200 - density * 400;
  app.scene.fogColor = new Color(
    0.04 + density * 0.08,
    0.05 + density * 0.07,
    0.09 + density * 0.06
  );
}
