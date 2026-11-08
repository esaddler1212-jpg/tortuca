import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { buildBayWater } from './build-bay';
import { buildCityStreets } from './build-city-streets';
import { buildAllDistricts, buildFreewayLamps } from './build-districts';
import { initHubStreaming } from './hub-streaming';
import { loadSettings } from './game-settings';
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
import { buildSideshowMeets } from './sideshow-meets';
import { NIGHT_FOG } from './night-palette';
import { WORLD_HALF_M } from './world-config';

export function buildDrivingWorld(app: AppBase): void {
  app.scene.fog = NIGHT_FOG.clone();

  const groundMat = new StandardMaterial();
  groundMat.diffuse = new Color(0.04, 0.045, 0.05);
  groundMat.gloss = 0.2;
  groundMat.update();

  const h = WORLD_HALF_M;
  const ground = new Entity('ground');
  ground.setLocalScale(h * 2, 0.4, h * 2);
  ground.setPosition(0, -0.35, 0);
  ground.addComponent('render', { type: 'box', material: groundMat });
  ground.addComponent('collision', { type: 'box', halfExtents: new Vec3(h, 0.2, h) });
  ground.addComponent('rigidbody', { type: 'static' });
  app.root.addChild(ground);

  buildBayWater(app);
  buildAllFreeways(app);
  buildFreewayRamps(app);
  buildCityStreets(app);
  buildHubParkingLots(app);
  buildStorefrontSigns(app);
  buildLombardStreet(app);
  buildCollectibles(app);
  buildCruiseVistas(app);
  spawnAmbientTraffic(app);
  buildSideshowMeets(app);
  buildAllDistricts(app);
  initHubStreaming(app, loadSettings().hubStreamingEnabled);
  buildBayAreaLandmarks(app);
  buildTacoTrucks(app);
  buildParkingSpots(app);
  buildGasStations(app);
  buildMissionSites(app);
  buildFreewayLamps(app, 120, 140);
}
