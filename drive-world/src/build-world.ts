import { FOG_LINEAR, type AppBase } from 'playcanvas';

import { buildBayWater } from './build-bay';
import { buildBayGround } from './build-bay-ground';
import { buildCityStreets } from './build-city-streets';
import { buildAllDistricts, buildFreewayLamps } from './build-districts';
import { initHubStreaming } from './hub-streaming';
import { buildCpmChallengePads } from './build-cpm-pads';
import { loadSettings } from './game-settings';
import type { BayQualityPreset } from './bay-quality';

function freewayLampBudget(preset: BayQualityPreset): { spacing: number; limit: number } {
  if (preset === 'chromebook') return { spacing: 165, limit: 52 };
  if (preset === 'lush') return { spacing: 105, limit: 165 };
  return { spacing: 120, limit: 140 };
}
import { buildAllFreeways } from './build-freeway';
import { buildFreewayRamps } from './build-freeway-ramps';
import { buildBayAreaLandmarks } from './build-landmarks';
import { buildHubParkingLots, buildStorefrontSigns } from './build-hub-world';
import { buildParkingSpots, buildGasStations } from './build-parking-gas';
import { buildTacoTrucks } from './build-taco-trucks';
import { buildMissionSites } from './build-mission-sites';
import {
  buildCollectibles,
  buildCruiseVistas,
  buildLombardStreet,
  spawnAmbientTraffic
} from './build-world-extras';
import { spawnHubStreetTraffic } from './hub-street-traffic';
import { spawnFreewayTrafficDrones } from './freeway-traffic-drones';
import { buildSideshowMeets } from './sideshow-meets';
import { buildOpenworldCherryPickMaze } from './build-openworld-maze';
import { NIGHT_FOG } from './night-palette';
export function buildDrivingWorld(app: AppBase): void {
  app.scene.fog.type = FOG_LINEAR;
  app.scene.fog.color = NIGHT_FOG.clone();

  const preset = loadSettings().bayQualityPreset;
  buildBayGround(app, preset);
  buildBayWater(app);
  buildAllFreeways(app);
  buildFreewayRamps(app);
  buildCityStreets(app);
  buildHubParkingLots(app);
  buildStorefrontSigns(app);
  buildLombardStreet(app);
  buildCollectibles(app);
  buildCruiseVistas(app);
  spawnAmbientTraffic(app, preset);
  spawnFreewayTrafficDrones(app, preset);
  spawnHubStreetTraffic(app, preset);
  buildSideshowMeets(app);
  buildAllDistricts(app);
  initHubStreaming(app, loadSettings().hubStreamingEnabled);
  buildBayAreaLandmarks(app);
  buildTacoTrucks(app);
  buildParkingSpots(app);
  buildCpmChallengePads(app);
  buildGasStations(app);
  buildMissionSites(app);
  const lamps = freewayLampBudget(loadSettings().bayQualityPreset);
  buildFreewayLamps(app, lamps.spacing, lamps.limit);
  void buildOpenworldCherryPickMaze(app, preset).catch((err) => {
    console.warn('[openworld] maze load failed', err);
  });
}
