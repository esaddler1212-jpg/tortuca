import {
  AppBase,
  Color,
  Entity,
  FILLMODE_FILL_WINDOW,
  RESOLUTION_AUTO,
  StandardMaterial,
  Vec3
} from 'playcanvas';
import { buildMetropolis, getDestructibles, spawnSimpleCars } from './build-city';
import { buildPlanetShell, earthLabel, initEarthDistrictRing } from './earth-planet';
import { getChronoState, tickEarthOrbit } from './earth-orbit';
import {
  applyPersistedWorldDecor,
  freshWantedAfterShatter,
  resetFateAfterAutoRoam,
  shatterAndRebuildEarth,
  villainAnnihilatePlanet,
  villainRemakeEarthInYourImage,
  worldGeneration
} from './world-reset';
import { installMonuments } from './build-monuments';
import { loadHeroMonument, loadVillainTheme, saveHeroMonument } from './world-persist';
import { applyVillainThemeTint } from './world-theme';
import {
  beginVillainDyingRoam,
  canDeclareHeroSave,
  createWorldFate,
  dyingRoamExpired,
  dyingRoamSecondsLeft,
  shouldOfferVillainDyingPlanet,
  type WorldFateState
} from './world-fate';
import { annihilateUnlocked, annihilateProgress } from './villain-annihilate';
import {
  isSolarFullyCharged,
  resetSolarCharge,
  solarPowerMultiplier,
  solarSmashMultiplier,
  tickSolarSpaceCharge
} from './solar-space-charge';
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
import { primaryStrikeParams, superCrater, throwProp } from './combat';
import {
  createCityIntegrity,
  addVillainHavoc,
  integrityHudLabel,
  syncIntegrityFromBuildings,
  type CityIntegrityState
} from './city-integrity';
import {
  damageNpcsInCone,
  nearestFoeCodename,
  spawnFactionWave,
  tickFactionNpcs,
  throwHitsNpcs,
  waveNpcCount,
  type FactionNpc
} from './faction-npcs';
import { villainRivalsForHero } from './villain-roster';
import { getPlayerRole, setPlayerRole, type PlayerRole } from './player-role';
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
  playerRole: PlayerRole;
  city: CityIntegrityState;
  factionNpcs: FactionNpc[];
  wave: number;
  waveCooldown: number;
  camera: Entity;
  stats: SessionStats;
  foesStopped: number;
  worldFate: WorldFateState;
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

  initEarthDistrictRing();
  const savedTheme = loadVillainTheme();
  const savedMonument = loadHeroMonument();
  if (savedTheme) applyVillainThemeTint(savedTheme.color, 0.72);
  buildMetropolis(app, root, { tier });
  buildPlanetShell(app, root);
  void placeKenneyLandmarks(app, root, tier === 'low' ? 8 : tier === 'high' ? 28 : 16);
  void placeWorldGachaTowns(app, root, tier === 'low' ? 0 : tier === 'high' ? 3 : 1);
  spawnSimpleCars(app, root, tier === 'low' ? 32 : tier === 'high' ? 160 : 90);
  applyPersistedWorldDecor(app, root, savedTheme, savedMonument);

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
    farClip: 48000,
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
    playerRole: getPlayerRole(),
    city: createCityIntegrity(),
    factionNpcs: [],
    wave: 0,
    waveCooldown: 6,
    camera,
    stats: loadSessionStats(),
    foesStopped: 0,
    worldFate: createWorldFate()
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
  const chrono = tickEarthOrbit(pos, s.hero.speedKmh(), dt);
  const simDt = dt * chrono.timeScale;
  const solarCharge = tickSolarSpaceCharge(s.heroSpec.id, pos, s.hero.speedKmh(), dt);
  const powerMul = s.heroForm.powerMul * solarPowerMultiplier(s.heroSpec.id);
  const tags = getDestructibles();

  if (s.heroSpec.id === 'solar-apex') {
    const [r, g, b] = s.heroForm.color;
    if (solarCharge >= 0.45) {
      paintHero(s.hero.entity, [
        Math.min(1, r + solarCharge * 0.4),
        Math.min(1, g + solarCharge * 0.3),
        Math.min(1, b + solarCharge * 0.12)
      ]);
    } else {
      paintHero(s.hero.entity, [r, g, b]);
    }
  }

  if (input.super && chrono.chronoArmed) {
    const blast = shatterAndRebuildEarth(s.app, s.root, s.tier, s.factionNpcs);
    s.destructionUsd += blast.costUsd;
    s.wanted = freshWantedAfterShatter();
    s.wave = 0;
    s.waveCooldown = 10;
    const home = spawnAtHome(s.heroSpec.districtId);
    s.hero.entity.setPosition(home);
    s.hero.velocity.set(0, 0, 0);
    addScreenShake(1.6);
    playSuper();
    s.stats = saveSessionStats({ supersUsed: s.stats.supersUsed + 1 });
    resetSolarCharge();
  }

  if (
    input.annihilate &&
    s.playerRole === 'villain' &&
    annihilateUnlocked(s.playerRole, s.city)
  ) {
    const blast = villainAnnihilatePlanet(s.app, s.root, s.tier, s.factionNpcs);
    addVillainHavoc(s.city, blast.costUsd);
    s.destructionUsd += blast.costUsd;
    s.wanted = freshWantedAfterShatter();
    s.wave = 0;
    s.waveCooldown = 12;
    const home = spawnAtHome(s.heroSpec.districtId);
    s.hero.entity.setPosition(home);
    s.hero.velocity.set(0, 0, 0);
    addScreenShake(2);
    playSuper();
    resetSolarCharge();
  }

  const smashRadius = s.heroSpec.smashRadius * powerMul * solarSmashMultiplier(s.heroSpec.id);
  const smash = checkHeroSmash(s.app, s.root, pos, s.hero.speedKmh(), smashRadius, tags, s.tier);
  if (smash.costUsd > 0) {
    s.destructionUsd += smash.costUsd;
    if (s.playerRole === 'villain') {
      addDestructionHeat(s.wanted, smash.costUsd, dt);
      addVillainHavoc(s.city, smash.costUsd);
    }
    syncIntegrityFromBuildings(s.city, tags);
    addScreenShake(0.25);
    playSmash();
  }

  if (input.boost && s.hero.speedKmh() > 200) {
    playWhoosh();
    spawnBoostTrail(s.app, s.root, pos.clone(), s.heroForm.color);
  }

  if (input.primary && s.hero.canPrimary()) {
    s.hero.triggerPrimary();
    const aim = s.hero.aimPoint();
    const strike = primaryStrikeParams(s.heroSpec, powerMul);
    const hits = damageNpcsInCone(pos, aim, s.factionNpcs, s.playerRole, strike.range, strike.cone, strike.dmg);
    if (hits > 0) playBlast(powerKind(s.heroSpec) as 'beam' | 'repulsor' | 'thunder' | 'ki' | 'default');
  }
  if (input.throw) {
    throwProp(tags, pos, []);
    throwHitsNpcs(pos, s.factionNpcs, s.playerRole);
  }
  if (input.super && s.hero.canSuper() && !chrono.chronoArmed) {
    s.hero.triggerSuper();
    const aim = s.hero.aimPoint(120);
    const blastRadius = 45 * powerMul * (isSolarFullyCharged(s.heroSpec.id) ? 1.35 : 1);
    const blast = superCrater(s.app, s.root, aim, tags, s.tier, blastRadius);
    s.destructionUsd += blast.costUsd;
    if (s.playerRole === 'villain') {
      addDestructionHeat(s.wanted, blast.costUsd, dt);
      addVillainHavoc(s.city, blast.costUsd);
    }
    syncIntegrityFromBuildings(s.city, tags);
    spawnCraterMarker(s.app, s.root, aim, blastRadius);
    addScreenShake(0.9);
    playSuper();
    s.stats = saveSessionStats({ supersUsed: s.stats.supersUsed + 1 });
  }

  const nowMs = Date.now();
  syncIntegrityFromBuildings(s.city, tags);
  if (shouldOfferVillainDyingPlanet(s.playerRole, s.city, s.worldFate)) {
    beginVillainDyingRoam(s.worldFate, nowMs);
  }
  if (dyingRoamExpired(s.worldFate, nowMs)) {
    shatterAndRebuildEarth(s.app, s.root, s.tier, s.factionNpcs, true);
    s.city = createCityIntegrity();
    s.wanted = freshWantedAfterShatter();
    s.wave = 0;
    s.waveCooldown = 12;
    resetFateAfterAutoRoam(s.worldFate);
    const home = spawnAtHome(s.heroSpec.districtId);
    s.hero.entity.setPosition(home);
    s.hero.velocity.set(0, 0, 0);
    addScreenShake(1.2);
    playSuper();
  }
  if (
    canDeclareHeroSave(
      s.playerRole,
      s.city,
      s.wave,
      s.factionNpcs.length,
      s.foesStopped,
      s.worldFate
    )
  ) {
    saveHeroMonument({
      heroId: s.heroSpec.id,
      codename: s.heroSpec.codename,
      districtId: s.heroSpec.districtId,
      color: s.heroForm.color
    });
    installMonuments(s.app, s.root, {
      codename: s.heroSpec.codename,
      color: s.heroForm.color,
      scope: s.heroSpec.districtId
    });
    s.worldFate.heroSaved = true;
    s.worldFate.phase = 'hero_saved';
    playWaveAlert();
  }

  const maxNpcs =
    s.playerRole === 'hero' ? 6 + Math.floor(s.wave / 2) : 8 + s.wanted.stars * 3;
  s.waveCooldown -= chrono.chronoFrozen ? simDt : dt;
  const roamQuiet = s.worldFate.phase === 'dying_roam';
  if (!roamQuiet && !chrono.chronoFrozen && s.waveCooldown <= 0 && s.factionNpcs.length < maxNpcs) {
    s.wave += 1;
    const cd = s.playerRole === 'hero' ? 14 : Math.max(4, 12 - s.wave * 0.4 - s.wanted.stars);
    s.waveCooldown = cd;
    const count = waveNpcCount(s.wave, s.wanted.stars, s.playerRole);
    const batch = spawnFactionWave(s.app, s.root, pos, count, s.playerRole, s.heroSpec.id, s.wave);
    s.factionNpcs.push(...batch);
    playWaveAlert();
  }
  const kills = tickFactionNpcs(
    s.factionNpcs,
    pos,
    chrono.chronoFrozen ? simDt : dt,
    s.root,
    s.playerRole,
    tags,
    s.tier,
    s.city,
    s.app
  );
  if (kills > 0) {
    s.foesStopped += kills;
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

  const chron = getChronoState();
  setHudSnapshot({
    heroName: s.heroSpec.codename,
    codename: s.heroSpec.tagline,
    district: earthLabel(pos),
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
    dronesLeft: s.factionNpcs.length,
    playerRole: s.playerRole,
    cityStatus: integrityHudLabel(s.playerRole, s.city),
    foesStopped: s.foesStopped,
    lifetimeDestructionUsd: lifetimeDestruction,
    dronesDestroyed: s.foesStopped,
    loadingTip: currentLoadingTip(),
    manifestHints: (getManifestSuggestions() ?? []).slice(0, 3).map((s) => s.title),
    orbitProgress: chron.orbitProgress,
    chronoArmed: chron.chronoArmed,
    chronoFrozen: chron.chronoFrozen,
    worldGeneration: worldGeneration(),
    annihilateUnlocked: annihilateUnlocked(s.playerRole, s.city),
    annihilateProgress: s.playerRole === 'villain' ? annihilateProgress(s.city) : 0,
    solarCharge: s.heroSpec.id === 'solar-apex' ? solarCharge : 0,
    nearestFoe: nearestFoeCodename(s.factionNpcs, s.playerRole, pos),
    villainRivals:
      s.playerRole === 'hero' ? villainRivalsForHero(s.heroSpec.id).slice(0, 4) : undefined,
    fatePrompt: s.worldFate.fatePrompt,
    dyingRoamSeconds: dyingRoamSecondsLeft(s.worldFate, nowMs),
    worldFatePhase: s.worldFate.phase,
    heroWorldSaved: s.worldFate.heroSaved
  });
}

export function confirmVillainWorldRemake(): void {
  if (!session || session.playerRole !== 'villain' || session.worldFate.phase !== 'dying_roam') return;
  villainRemakeEarthInYourImage(
    session.app,
    session.root,
    session.tier,
    session.factionNpcs,
    session.heroSpec,
    session.heroForm
  );
  session.city = createCityIntegrity();
  session.wanted = freshWantedAfterShatter();
  session.wave = 0;
  session.waveCooldown = 10;
  resetFateAfterAutoRoam(session.worldFate);
  const home = spawnAtHome(session.heroSpec.districtId);
  session.hero.entity.setPosition(home);
  session.hero.velocity.set(0, 0, 0);
  addScreenShake(1.8);
  playSuper();
}

export function continueDyingRoam(): void {
  if (!session) return;
  session.worldFate.fatePrompt = false;
}

export function selectPlayerRole(role: PlayerRole): void {
  setPlayerRole(role);
  window.location.reload();
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
