import type { AppBase } from 'playcanvas';

import type { GameSettings } from './game-settings';

/** Poly Haven CC0 — optional night sky for Lush / Console presets. */
const POLYHAVEN_NIGHT_JPG =
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/jpg/1k/moonlit_golf_1k.jpg';

/** Tier 4 — richer sky read when quality is not Chromebook-low. */
export async function applyCityNightsSky(app: AppBase, settings: GameSettings): Promise<void> {
  if (settings.bayQualityPreset === 'chromebook' || settings.fogQuality === 'low') return;

  await new Promise<void>((resolve) => {
    app.assets.loadFromUrl(POLYHAVEN_NIGHT_JPG, 'texture', (err, asset) => {
      if (!err && asset?.resource) {
        app.scene.skybox = asset.resource;
        app.scene.skyboxIntensity = settings.bayQualityPreset === 'lush' ? 0.55 : 0.42;
        app.scene.skyboxMip = 0;
      }
      resolve();
    });
  });
}