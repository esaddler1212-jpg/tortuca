import {
  AppBase,
  Color,
  Entity,
  FILLMODE_FILL_WINDOW,
  RESOLUTION_AUTO,
  StandardMaterial,
  Vec3
} from 'playcanvas';
import { buildMetropolis, getDestructibles, nearestDistrictLabel, spawnSimpleCars } from './build-city';
import { attachUnitBox } from './primitive-mesh';
import {
  DEFAULT_HERO_ID,
  getHero,
  type HeroForm,
  type HeroSpec,
  type PowerKind
} from './hero-roster';
import { resolveHeroForm, storedFormId } from './hero-forms';
import { spawnAtHome } from './districts';
import { HeroFlightController } from './hero-flight';
import { bindFlightKeys, pollFlightInput } from './game-input';
import { setHudSnapshot } from './game-bridge';
import { detectQualityTier, type QualityTier } from './quality-tier';
import { checkHeroSmash, tickDebris } from './destruction';
import { addDestructionHeat, createWanted, type WantedState } from './wanted';
import {
  firePrimary,
  spawnWaveDrones,
  superCrater,
  throwProp,
  tickDrones,
  waveDroneCount,
  type EnemyDrone
} from './combat';
import { isPhotoMode, togglePhotoMode } from './photo-mode';
import { fetchManifestIfOnline, getManifestSuggestions } from './updates';
import { attachHeroGltf } from './hero-gltf';
import { placeKenneyLandmarks } from './build-city-kenney';
import { placeWorldGachaTowns } from './build-city-worldgacha';
import { applySkyEnvironment, applyWeatherMood, fetchBayWeatherMood } from './sky-env';
import { currentLoadingTip } from './loading-tips';
import { loadCustomHeroes, customHeroToSpec } from './custom-hero';
import { addScreenShake, consumeShake, spawnBoostTrail, spawnCraterMarker, tickTrails } from './vfx';
import { bootAudioFromGesture, playBlast, playSmash, playSuper, playWaveAlert, playWhoosh } from './game-audio';
import { loadSessionStats, saveSessionStats, type SessionStats } from './session-persist';

export type GameSession = {
  app: AppBase;
  root: Entity;
  hero: HeroFlightController;
  heroSpec: HeroSpec;
  heroForm: HeroForm;
  tier: QualityTier;
  destructionUsd: number;
  wanted: WantedState;
  drones: EnemyDrone[];
  wave: number;
  waveCooldown: number;
  camera: Entity;
  stats: SessionStats;
  dronesDestroyed: number;
};

let session: GameSession | null = null;

function pickHero(): HeroSpec {
  const stored = localStorage.getItem('flight-nemulator-hero-id') ?? DEFAULT_HERO_ID;
  const custom = loadCustomHeroes().find((c) => c.id === stored);
  if (custom) return customHeroToSpec(custom);
  return getHero(stored) ?? getHero(DEFAULT_HERO_ID)!;
}

function paintHero(entity: Entity, color: [number, number, number]): void {
  const mi = entity.render?.meshInstances?.[0];
  const mat = mi?.material as StandardMaterial | undefined;
  if (!mat) return;
  mat.diffuse = new Color(color[0], color[1], color[2]);
  mat.emissive = new Color(color[0] * 0.35, color[1] * 0.35, color[2] * 0.35);
  mat.update();
}

export async function startGame(app: AppBase): Promise<void> {
  bindFlightKeys();
  bootAudioFromGesture();
  void fetchManifestIfOnline();

  const tier = detectQualityTier();
  const heroSpec = pickHero();
  const heroForm = resolveHeroForm(heroSpec, storedFormId(heroSpec));
  const spawn = spawnAtHome(heroSpec.districtId);

  const root = new Entity('world-root');
  app.root.addChild(root);

  await applySkyEnvironment(app, tier);
  const weatherMood = await fetchBayWeatherMood();
  applyWeatherMood(app, weatherMood);

  buildMetropolis(app, root, { tier });
  void placeKenneyLandmarks(app, root, tier === 'low' ? 8 : tier === 'high' ? 28 : 16);
  void placeWorldGachaTowns(app, root, tier === 'low' ? 0 : tier === 'high' ? 3 : 1);
  spawnSimpleCars(app, root, tier === 'low' ? 32 : tier === 'high' ? 160 : 90);

  const flight = new HeroFlightController(heroSpec, heroForm, spawn);
  const [r, g, b] = heroForm.color;
  flight.entity.addComponent('render', {
    meshInstances: [attachUnitBox(app, r, g, b)]
  });
  flight.entity.setLocalScale(1.8, 3.2, 1.2);
  root.addChild(flight.entity);
  void attachHeroGltf(app, flight.entity, heroSpec.id, heroForm.color);

  const camera = new Entity('camera');
  camera.addComponent('camera', {
    clearColor: new Color(0.04, 0.06, 0.12),
    farClip: 8000,
    nearClip: 0.3,
    fov: 60
  });
  app.root.addChild(camera);

  session = {
    app,
    root,
    hero: flight,
    heroSpec,
    heroForm,
    tier,
    destructionUsd: 0,
    wanted: createWanted(),
    drones: [],
    wave: 0,
    waveCooldown: 6,
    camera,
    stats: loadSessionStats(),
    dronesDestroyed: 0
  };

  app.on('update', (dt: number) => {
    if (!session) return;
    tickFrame(session, dt);
  });

  app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(RESOLUTION_AUTO);
  app.start();
}

function powerKind(hero: HeroSpec): PowerKind {
  return hero.powers[0] ?? 'beam';
}

function tickFrame(s: GameSession, dt: number): void {
  const input = pollFlightInput();
  if (input.photo) togglePhotoMode();

  s.hero.form = s.heroForm;
  s.hero.update(dt, input);
  const pos = s.hero.entity.getPosition();
  const tags = getDestructibles();

  const smashRadius = s.heroSpec.smashRadius * s.heroForm.powerMul;
  const smash = checkHeroSmash(s.app, s.root, pos, s.hero.speedKmh(), smashRadius, tags, s.tier);
  if (smash.costUsd > 0) {
    s.destructionUsd += smash.costUsd;
    addDestructionHeat(s.wanted, smash.costUsd, dt);
    addScreenShake(0.25);
    playSmash();
  }

  if (input.boost && s.hero.speedKmh() > 200) {
    playWhoosh();
    spawnBoostTrail(s.app, s.root, pos.clone(), s.heroForm.color);
  }

  if (input.primary && s.hero.canPrimary()) {
    s.hero.triggerPrimary();
    const hits = firePrimary(s.heroSpec, pos, s.hero.aimPoint(), s.drones, s.heroForm.powerMul);
    if (hits > 0) playBlast(powerKind(s.heroSpec) as 'beam' | 'repulsor' | 'thunder' | 'ki' | 'default');
  }
  if (input.throw) {
    throwProp(tags, pos, s.drones);
  }
  if (input.super && s.hero.canSuper()) {
    s.hero.triggerSuper();
    const aim = s.hero.aimPoint(120);
    const blastRadius = 45 * s.heroForm.powerMul;
    const blast = superCrater(s.app, s.root, aim, tags, s.tier, blastRadius);
    s.destructionUsd += blast.costUsd;
    addDestructionHeat(s.wanted, blast.costUsd, dt);
    spawnCraterMarker(s.app, s.root, aim, blastRadius);
    addScreenShake(0.9);
    playSuper();
    s.stats = saveSessionStats({ supersUsed: s.stats.supersUsed + 1 });
  }

  const maxDrones = 8 + s.wanted.stars * 3;
  s.waveCooldown -= dt;
  if (s.waveCooldown <= 0 && s.drones.length < maxDrones) {
    s.wave += 1;
    s.waveCooldown = Math.max(4, 12 - s.wave * 0.4 - s.wanted.stars);
    const count = waveDroneCount(s.wave, s.wanted.stars);
    const batch = spawnWaveDrones(s.app, s.root, pos, count);
    batch.forEach((d) => {
      d.entity.addComponent('render', {
        meshInstances: [attachUnitBox(s.app, 0.85, 0.2, 0.15)]
      });
      d.entity.setLocalScale(3.5, 1.2, 3.5);
    });
    s.drones.push(...batch);
    playWaveAlert();
  }
  const kills = tickDrones(s.drones, pos, dt, s.root);
  if (kills > 0) {
    s.dronesDestroyed += kills;
    s.stats = saveSessionStats({ dronesDestroyed: s.stats.dronesDestroyed + kills });
  }

  tickDebris(dt, s.root);
  tickTrails(dt, s.root);

  const f = s.hero.forward();
  const shake = consumeShake();
  const camPos = new Vec3(
    pos.x - f.x * 14 + shake.x,
    pos.y + 5 + shake.y,
    pos.z - f.z * 14 + shake.z
  );
  s.camera.setPosition(camPos);
  s.camera.lookAt(pos);

  const lifetimeDestruction = s.stats.destructionUsd + s.destructionUsd;
  saveSessionStats({ destructionUsd: lifetimeDestruction, wavesCleared: s.wave });

  setHudSnapshot({
    heroName: s.heroSpec.codename,
    codename: s.heroSpec.tagline,
    district: nearestDistrictLabel(pos),
    speedKmh: Math.round(s.hero.speedKmh()),
    destructionUsd: s.destructionUsd,
    wantedStars: s.wanted.stars,
    wave: s.wave,
    stamina: Math.round(s.hero.stamina),
    staminaMax: s.heroSpec.energy.staminaMax,
    superReady: s.hero.canSuper(),
    quality: s.tier,
    flightMode: !isPhotoMode(),
    photoMode: isPhotoMode(),
    heroX: pos.x,
    heroZ: pos.z,
    dronesLeft: s.drones.length,
    lifetimeDestructionUsd: lifetimeDestruction,
    dronesDestroyed: s.dronesDestroyed,
    loadingTip: currentLoadingTip(),
    manifestHints: (getManifestSuggestions() ?? []).slice(0, 3).map((s) => s.title)
  });
}

export function selectHero(heroId: string, formId?: string): void {
  const prev = localStorage.getItem('flight-nemulator-hero-id');
  localStorage.setItem('flight-nemulator-hero-id', heroId);
  if (formId) localStorage.setItem(`flight-nemulator-form-${heroId}`, formId);

  if (session && prev === heroId && formId) {
    const spec = pickHero();
    session.heroForm = resolveHeroForm(spec, formId);
    session.hero.form = session.heroForm;
    paintHero(session.hero.entity, session.heroForm.color);
    return;
  }
  window.location.reload();
}
