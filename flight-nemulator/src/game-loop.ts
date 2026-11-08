import {
  AppBase,
  Color,
  Entity,
  FILLMODE_FILL_WINDOW,
  RESOLUTION_AUTO,
  StandardMaterial,
  Vec3
} from 'playcanvas';
import { buildMetropolis, districtIdAtPosition, getDestructibles, spawnSimpleCars } from './build-city';
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
  type HeroSpec
} from './hero-roster';
import { aerialHudLabel, syncFlightAssistVisuals } from './aerial-mobility';
import { kitHudLabel } from './hero-customization';
import { effectiveHeroAerial, resolveHeroForm, storedFormId } from './hero-forms';
import { spawnAtHome } from './districts';
import { HeroFlightController } from './hero-flight';
import {
  PAIR_BOSS_WAVE,
  pairBossHpPercent,
  pairVillainCodename,
  spawnPairBoss
} from './hero-pair-boss';
import { spawnVillainApexInterceptor, VILLAIN_APEX_WAVE, villainApexCodename } from './hero-villain-apex';
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
import { canPickAlignment, DUAL_ROLE_HERO_ID, enforceAlignmentForHero, isVillainOnlyHero } from './hero-alignment';
import {
  absorbDefeatedFoe,
  absorptionHudLine,
  ABSORBER_HERO_IDS,
  loadAbsorption
} from './hero-absorption';
import { isSymbioteUnlocked, symbiotePreyProfile, unlockSymbioteSuit } from './hero-symbiote';
import { bondVenomToHero, venomBondHudLine, VENOM_PLAYABLE_ID } from './hero-venom-bond';
import {
  applySolarCorruption,
  isSolarCorrupted,
  lanternAidForFinalBoss,
  lanternArcHudLine,
  lanternKeeperSlain,
  markLanternAid,
  nearLanternSafeHouse,
  spawnLanternAlly,
  spawnLanternKeeper,
  SOLAR_HERO_ID
} from './solar-lantern-arc';
import {
  applyDoomGodEmperor,
  doomHeroTimelineGeneration,
  doomHeroTimelineJump,
  doomStoryHudLine,
  DOOM_GOD_EMPEROR_FORM,
  isDoomGodEmperor
} from './doom-story-arc';
import {
  battleworldLatticeStrength,
  latticeBeatChip,
  maybeRecordTerritoryClear,
  recordArcBeat
} from './arc-progress';
import { nextBattleworldChapterHint, battleworldChapterChip } from './battleworld-chapters';
import {
  characterArcHudLine,
  latticeHudLine,
  tryArcDistrictInteract,
  villainRunwayHudLine
} from './battleworld-arcs';
import {
  consumeLatticeCloudLabel,
  pullBattleworldLatticeCloud
} from './battleworld-lattice-cloud';
import { battleworldRoleBlurb } from './battleworld';
import {
  createInfinityStoneState,
  infinityBossBlocksFinale,
  infinityPowerMultiplier,
  infinityStonesHudLine,
  playerInfinityStoneCount,
  resetInfinityHunt,
  type InfinityStoneState
} from './infinity-stones-arc';
import { tickInfinityStonePhase, tryInteractInfinityStone } from './infinity-stones-tick';
import {
  addDistrictDestruction,
  canHeroFacePairBoss,
  createTerritoryState,
  nearVillainAdvisor,
  pairHeroHintForPlayerVillain,
  spawnVillainAdvisors,
  territoryHudLine,
  territoryTakeoverCount,
  villainAdvisorHint,
  type TerritoryState
} from './territory-invasion';
import {
  applyTerritoryHenchmenChoice,
  applyTerritoryRazeChoice,
  heroReclaimRazeDistrict,
  tickTerritoryInvasion
} from './territory-tick';
import { isPhotoMode, togglePhotoMode } from './photo-mode';
import { fetchManifestIfOnline, getManifestSuggestions } from './updates';
import { attachHeroGltf } from './hero-gltf';
import { placeKenneyLandmarks } from './build-city-kenney';
import { placeWorldGachaTowns } from './build-city-worldgacha';
import { universeForDistrict } from './battleworld-districts';
import {
  applyBattleworldUniverseFog,
  applySkyEnvironment,
  applyWeatherMood,
  fetchBayWeatherMood
} from './sky-env';
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
  pairBoss: { spawned: boolean; defeated: boolean; warned: boolean };
  lanternKeeper: import('./solar-lantern-arc').LanternKeeper | null;
  territory: TerritoryState;
  infinity: InfinityStoneState;
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
  await pullBattleworldLatticeCloud(heroSpec.id);
  enforceAlignmentForHero(heroSpec.id);
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
  syncFlightAssistVisuals(
    app,
    flight.entity,
    effectiveHeroAerial(heroSpec, heroForm),
    heroForm.color
  );

  const camera = new Entity('camera');
  camera.addComponent('camera', {
    clearColor: new Color(0.04, 0.06, 0.12),
    farClip: 48000,
    nearClip: 0.3,
    fov: 60
  });
  app.root.addChild(camera);

  const playerRole = getPlayerRole();
  const territory = createTerritoryState();
  if (playerRole === 'villain') {
    territory.advisors = spawnVillainAdvisors(app, root);
  }

  session = {
    app,
    root,
    hero: flight,
    heroSpec,
    heroForm,
    tier,
    destructionUsd: 0,
    wanted: createWanted(),
    playerRole,
    city: createCityIntegrity(),
    factionNpcs: [],
    wave: 0,
    waveCooldown: 6,
    camera,
    stats: loadSessionStats(),
    foesStopped: 0,
    worldFate: createWorldFate(),
    pairBoss: { spawned: false, defeated: false, warned: false },
    lanternKeeper:
      heroSpec.id === SOLAR_HERO_ID &&
      playerRole === 'hero' &&
      !lanternKeeperSlain() &&
      !lanternAidForFinalBoss()
        ? spawnLanternKeeper(app, root)
        : null,
    territory,
    infinity: createInfinityStoneState(app, root)
  };

  app.on('update', (dt: number) => {
    if (!session) return;
    tickFrame(session, dt);
  });

  app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(RESOLUTION_AUTO);
  app.start();
}


function combatForm(s: GameSession): HeroForm {
  const base = s.heroForm;
  if (!ABSORBER_HERO_IDS.has(s.heroSpec.id)) return base;
  const a = loadAbsorption(s.heroSpec.id);
  return {
    ...base,
    speedMul: base.speedMul * a.speedMul,
    dmgMul: (base.dmgMul ?? 1) * a.dmgMul,
    kitPrimary: a.kitPrimary ?? base.kitPrimary
  };
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
  const activeForm = combatForm(s);
  const powerMul =
    activeForm.powerMul * solarPowerMultiplier(s.heroSpec.id) * infinityPowerMultiplier(s.heroSpec.id);
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
    if (s.heroSpec.id === DUAL_ROLE_HERO_ID && !isDoomGodEmperor()) {
      applyDoomGodEmperor();
      s.heroForm = resolveHeroForm(s.heroSpec, DOOM_GOD_EMPEROR_FORM);
      s.hero.form = s.heroForm;
      paintHero(s.hero.entity, s.heroForm.color);
    }
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
      addDistrictDestruction(
        s.territory,
        districtIdAtPosition(pos.x, pos.z),
        smash.costUsd,
        s.heroSpec.districtId
      );
    }
    syncIntegrityFromBuildings(s.city, tags);
    addScreenShake(0.25);
    playSmash();
  }

  if (input.boost && s.hero.speedKmh() > 200) {
    playWhoosh();
    spawnBoostTrail(s.app, s.root, pos.clone(), s.heroForm.color);
  }

  const districtHere = districtIdAtPosition(pos.x, pos.z);
  applyBattleworldUniverseFog(s.app, universeForDistrict(districtHere));
  if (input.interact && tryInteractInfinityStone(s.infinity, pos, s.playerRole, s.heroSpec.id)) {
    recordArcBeat(s.heroSpec.id, 'stone-linked');
    if (playerInfinityStoneCount() >= 6) recordArcBeat(s.heroSpec.id, 'hunt-ascended');
    playWaveAlert();
    if (
      s.playerRole === 'villain' &&
      s.heroSpec.id === DUAL_ROLE_HERO_ID &&
      isDoomGodEmperor()
    ) {
      s.heroForm = resolveHeroForm(s.heroSpec, DOOM_GOD_EMPEROR_FORM);
      s.hero.form = s.heroForm;
      paintHero(s.hero.entity, s.heroForm.color);
    }
  } else if (input.interact && s.heroSpec.id === SOLAR_HERO_ID && nearLanternSafeHouse(pos) && !lanternAidForFinalBoss() && !isSolarCorrupted() && !s.pairBoss.spawned) {
    markLanternAid();
    playWaveAlert();
  }
  if (input.interact && s.playerRole === 'villain' && districtHere) {
  const row = s.territory.districts[districtHere];
    if (row?.status === 'held_choice') {
      applyTerritoryHenchmenChoice(
        s.territory,
        districtHere,
        s.app,
        s.root,
        s.factionNpcs,
        s.heroSpec.id,
        s.wave
      );
    }
    const advisor = nearVillainAdvisor(s.territory.advisors, pos);
    if (advisor) {
      s.territory.lastHint = villainAdvisorHint(advisor.clone);
      playWaveAlert();
    }
  }
  if (input.territoryRaze && s.playerRole === 'villain' && districtHere) {
    applyTerritoryRazeChoice(s.territory, districtHere, s.city);
  }
  if (input.interact && s.playerRole === 'hero' && districtHere) {
    if (heroReclaimRazeDistrict(s.territory, districtHere)) {
      playWaveAlert();
      maybeRecordTerritoryClear(
        s.heroSpec.id,
        s.playerRole,
        territoryTakeoverCount(s.territory)
      );
    }
  }
  if (input.interact) {
    const arcTap = tryArcDistrictInteract(s.heroSpec.id, districtHere);
    if (arcTap) {
      recordArcBeat(s.heroSpec.id, arcTap.beat);
      playWaveAlert();
    }
  }

  if (input.primary && s.hero.canPrimary()) {
    s.hero.triggerPrimary();
    const aim = s.hero.aimPoint();
    const strike = primaryStrikeParams(s.heroSpec, powerMul, activeForm);
    if (s.lanternKeeper && s.lanternKeeper.hp > 0) {
      const kp = s.lanternKeeper.entity.getPosition();
      const toK = new Vec3(kp.x - pos.x, kp.y - pos.y, kp.z - pos.z).length();
      const toAim = new Vec3(kp.x - aim.x, kp.y - aim.y, kp.z - aim.z).length();
      if (toK < strike.range && toAim < strike.cone) {
        s.lanternKeeper.hp -= strike.dmg;
        if (s.lanternKeeper.hp <= 0) {
          s.root.removeChild(s.lanternKeeper.entity);
          s.lanternKeeper.entity.destroy();
          s.lanternKeeper = null;
          applySolarCorruption();
          playSuper();
          window.location.reload();
        }
      }
    }
    const hits = damageNpcsInCone(pos, aim, s.factionNpcs, s.playerRole, strike.range, strike.cone, strike.dmg);
    if (hits > 0) {
      const blast =
        strike.primary === 'beam' ||
        strike.primary === 'repulsor' ||
        strike.primary === 'thunder' ||
        strike.primary === 'ki'
          ? strike.primary
          : 'default';
      playBlast(blast);
    }
  }
  if (input.throw) {
    throwProp(tags, pos, []);
    throwHitsNpcs(pos, s.factionNpcs, s.playerRole);
  }
  if (input.super && s.hero.canSuper() && !chrono.chronoArmed) {
    s.hero.triggerSuper();
    const aim = s.hero.aimPoint(120);
    const superKit = s.heroForm.superRadiusMul ?? 1;
    const blastRadius = 45 * powerMul * superKit * (isSolarFullyCharged(s.heroSpec.id) ? 1.35 : 1);
    const blast = superCrater(s.app, s.root, aim, tags, s.tier, blastRadius);
    s.destructionUsd += blast.costUsd;
    if (s.playerRole === 'villain') {
      addDestructionHeat(s.wanted, blast.costUsd, dt);
      addVillainHavoc(s.city, blast.costUsd);
      addDistrictDestruction(
        s.territory,
        districtIdAtPosition(aim.x, aim.z),
        blast.costUsd,
        s.heroSpec.districtId
      );
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
    recordArcBeat(s.heroSpec.id, 'world-saved');
    playWaveAlert();
  }

  const pairBossNpc = s.factionNpcs.find((n) => n.isPairBoss);
  const pairBossAlive = s.pairBoss.spawned && !s.pairBoss.defeated && !!pairBossNpc;

  if (
    !s.pairBoss.defeated &&
    s.wave >= PAIR_BOSS_WAVE - 3 &&
    !s.pairBoss.warned &&
    (s.playerRole === 'hero' || isVillainOnlyHero(s.heroSpec.id))
  ) {
    s.pairBoss.warned = true;
    playWaveAlert();
  }

  const maxNpcs =
    s.playerRole === 'hero' ? 6 + Math.floor(s.wave / 2) : 8 + s.wanted.stars * 3;
  s.waveCooldown -= chrono.chronoFrozen ? simDt : dt;
  const roamQuiet = s.worldFate.phase === 'dying_roam';
  const canSpawnWaves = !pairBossAlive && (s.pairBoss.defeated || !s.pairBoss.spawned);
  if (!roamQuiet && !chrono.chronoFrozen && canSpawnWaves && s.waveCooldown <= 0 && s.factionNpcs.length < maxNpcs) {
  if (
    s.playerRole === 'hero' &&
    !s.pairBoss.spawned &&
    !s.pairBoss.defeated &&
    s.wave + 1 >= PAIR_BOSS_WAVE &&
    canHeroFacePairBoss(s.territory) &&
    !infinityBossBlocksFinale(s.factionNpcs)
  ) {
    s.wave += 1;
    for (const n of [...s.factionNpcs]) {
      s.root.removeChild(n.entity);
      n.entity.destroy();
    }
    const boss = spawnPairBoss(s.app, s.root, pos, s.heroSpec.id);
    if (s.heroSpec.id === SOLAR_HERO_ID && lanternAidForFinalBoss()) {
      boss.hp *= 0.75;
      if (boss.maxHp) boss.maxHp *= 0.75;
      s.factionNpcs = [boss, spawnLanternAlly(s.app, s.root, pos)];
    } else {
      s.factionNpcs = [boss];
    }
    s.pairBoss.spawned = true;
    s.waveCooldown = 30;
    playWaveAlert();
    addScreenShake(0.75);
  } else if (
    isVillainOnlyHero(s.heroSpec.id) &&
    !s.pairBoss.spawned &&
    !s.pairBoss.defeated &&
    s.wave + 1 >= VILLAIN_APEX_WAVE
  ) {
    s.wave += 1;
    for (const n of [...s.factionNpcs]) {
      s.root.removeChild(n.entity);
      n.entity.destroy();
    }
    s.factionNpcs = [spawnVillainApexInterceptor(s.app, s.root, pos, s.heroSpec.id)];
    s.pairBoss.spawned = true;
    s.waveCooldown = 28;
    playWaveAlert();
    addScreenShake(0.65);
  } else {
    s.wave += 1;
    const cd = s.playerRole === 'hero' ? 14 : Math.max(4, 12 - s.wave * 0.4 - s.wanted.stars);
    s.waveCooldown = cd;
    const count = waveNpcCount(s.wave, s.wanted.stars, s.playerRole);
    const batch = spawnFactionWave(s.app, s.root, pos, count, s.playerRole, s.heroSpec.id, s.wave);
    s.factionNpcs.push(...batch);
    playWaveAlert();
  }
  }

  if (pairBossNpc) {
    const bp = pairBossNpc.entity.getPosition();
    const dist = new Vec3(bp.x - pos.x, bp.y - pos.y, bp.z - pos.z).length();
    if (dist < 42) {
      const res = s.heroForm.resilienceMul ?? 1;
      s.hero.stamina = Math.max(0, s.hero.stamina - (10 * simDt) / res);
    }
  }
  tickInfinityStonePhase(s.infinity, dt, s.factionNpcs, s.app, s.root);

  const takeoversBefore = territoryTakeoverCount(s.territory);
  tickTerritoryInvasion(
    s.territory,
    s.factionNpcs,
    s.app,
    s.root,
    pos,
    dt,
    s.playerRole,
    s.heroSpec.id,
    s.wave,
    s.city
  );
  if (s.playerRole === 'hero' && takeoversBefore > 0 && territoryTakeoverCount(s.territory) === 0) {
    maybeRecordTerritoryClear(s.heroSpec.id, s.playerRole, 0);
  }

  const npcTick = tickFactionNpcs(
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
  const kills = npcTick.kills;
  for (const d of npcTick.defeated) {
    if (s.heroSpec.id === 'wall-crawler' && symbiotePreyProfile(d.profileId)) {
      unlockSymbioteSuit();
    }
    if (s.heroSpec.id === VENOM_PLAYABLE_ID && s.playerRole === 'villain') {
      bondVenomToHero(d.profileId, d.codename);
    }
    absorbDefeatedFoe(s.heroSpec.id, d.profileId, d.codename);
    if (d.codename.startsWith('God Emperor')) {
      resetInfinityHunt(s.infinity, s.app, s.root);
      playSuper();
    }
  }
  if (kills > 0) {
    s.foesStopped += kills;
    s.stats = saveSessionStats({ dronesDestroyed: s.stats.dronesDestroyed + kills });
  }

  if (s.pairBoss.spawned && !s.pairBoss.defeated && !s.factionNpcs.some((n) => n.isPairBoss)) {
    s.pairBoss.defeated = true;
    if (isVillainOnlyHero(s.heroSpec.id)) {
      recordArcBeat(s.heroSpec.id, 'villain-apex');
    } else {
      recordArcBeat(s.heroSpec.id, 'pair-down');
    }
    s.waveCooldown = 16;
    playSuper();
    addScreenShake(1.1);
    if (
      s.heroSpec.id === DUAL_ROLE_HERO_ID &&
      s.playerRole === 'hero' &&
      doomHeroTimelineGeneration() == null
    ) {
      const jump = doomHeroTimelineJump(s.app, s.root, s.tier, s.factionNpcs, s.worldFate);
      s.city = jump.city;
      s.wanted = jump.wanted;
      s.wave = 0;
      s.waveCooldown = 14;
      s.destructionUsd += 2_500_000_000;
      const home = spawnAtHome(s.heroSpec.districtId);
      s.hero.entity.setPosition(home);
      s.hero.velocity.set(0, 0, 0);
      playWaveAlert();
      addScreenShake(1.4);
    }
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
  const bossForHud = s.factionNpcs.find((n) => n.isPairBoss);
  const bossAliveHud = s.pairBoss.spawned && !s.pairBoss.defeated && !!bossForHud;
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
    pairBossName:
      s.playerRole === 'hero'
        ? pairVillainCodename(s.heroSpec.id)
        : isVillainOnlyHero(s.heroSpec.id)
          ? villainApexCodename(s.heroSpec.id)
          : null,
    pairBossHpPct: pairBossHpPercent(bossForHud),
    pairBossStatus:
      s.playerRole === 'hero' || isVillainOnlyHero(s.heroSpec.id)
        ? s.pairBoss.defeated
          ? 'defeated'
          : bossAliveHud
            ? 'active'
            : s.pairBoss.warned && !s.pairBoss.spawned
              ? 'incoming'
              : null
        : null,
    fatePrompt: s.worldFate.fatePrompt,
    dyingRoamSeconds: dyingRoamSecondsLeft(s.worldFate, nowMs),
    worldFatePhase: s.worldFate.phase,
    heroWorldSaved: s.worldFate.heroSaved,
    aerialMobility: aerialHudLabel(effectiveHeroAerial(s.heroSpec, s.heroForm)),
    loadoutLabel: kitHudLabel(s.heroForm),
    symbioteUnlocked: s.heroSpec.id === 'wall-crawler' ? isSymbioteUnlocked() : undefined,
    absorptionLabel: absorptionHudLine(loadAbsorption(s.heroSpec.id)),
    venomBondLabel: s.heroSpec.id === VENOM_PLAYABLE_ID ? venomBondHudLine() : null,
    lanternSafehouseNear:
      s.heroSpec.id === SOLAR_HERO_ID && nearLanternSafeHouse(pos) && s.playerRole === 'hero',
    lanternArcHint: lanternArcHudLine(
      nearLanternSafeHouse(pos),
      lanternAidForFinalBoss(),
      isSolarCorrupted()
    ),
    doomStoryHint: doomStoryHudLine(s.heroSpec.id, s.playerRole),
    territoryHint: territoryHudLine(
      s.territory,
      s.playerRole,
      districtIdAtPosition(pos.x, pos.z),
      s.heroSpec.districtId
    ),
    villainAdvisorHint: s.territory.lastHint,
    takeoverDistricts: territoryTakeoverCount(s.territory),
    villainScoutHint:
      s.playerRole === 'villain' ? pairHeroHintForPlayerVillain(s.heroSpec.id) : null,
    battleworldTagline: battleworldRoleBlurb(s.playerRole),
    infinityStoneHint: infinityStonesHudLine(s.infinity, s.playerRole, s.heroSpec.id),
    pairBossBlocked:
      s.playerRole === 'hero' &&
      (!canHeroFacePairBoss(s.territory) || infinityBossBlocksFinale(s.factionNpcs)),
    characterArcHint: characterArcHudLine(s.heroSpec.id, {
      role: s.playerRole,
      wave: s.wave,
      takeoverCount: territoryTakeoverCount(s.territory),
      pairBossBlocked:
        s.playerRole === 'hero' &&
        (!canHeroFacePairBoss(s.territory) || infinityBossBlocksFinale(s.factionNpcs)),
      playerStones: playerInfinityStoneCount(),
      stonesSealed: s.infinity.sites.filter((st) => st.claimedBy === 'sealed').length,
      districtId: districtIdAtPosition(pos.x, pos.z),
      lattice: battleworldLatticeStrength()
    }),
    latticeHint:
      battleworldLatticeStrength() > 0
        ? latticeHudLine(battleworldLatticeStrength())
        : null,
    latticeBeatChip: latticeBeatChip(s.heroSpec.id, s.playerRole),
    latticeCloudHint: consumeLatticeCloudLabel(),
    villainRunwayHint: villainRunwayHudLine(s.heroSpec.id, s.wave),
    chapterHint: nextBattleworldChapterHint(
      s.heroSpec.id,
      s.playerRole,
      isVillainOnlyHero(s.heroSpec.id)
    ),
    chapterChip: battleworldChapterChip(s.heroSpec.id, s.playerRole, isVillainOnlyHero(s.heroSpec.id)),
    alignmentNote: canPickAlignment(s.heroSpec.id)
      ? 'Doom: toggle Hero or Villain below'
      : s.heroSpec.id === VENOM_PLAYABLE_ID
        ? 'Defeat hero responders to bond new loadouts'
        : ABSORBER_HERO_IDS.has(s.heroSpec.id)
          ? 'Absorb fallen foes to copy powers'
          : null
  });
}

export function confirmVillainWorldRemake(): void {
  if (!session || session.playerRole !== 'villain' || session.worldFate.phase !== 'dying_roam') return;
  if (session.heroSpec.id === DUAL_ROLE_HERO_ID && !isDoomGodEmperor()) {
    applyDoomGodEmperor();
    session.heroForm = resolveHeroForm(session.heroSpec, DOOM_GOD_EMPEROR_FORM);
    session.hero.form = session.heroForm;
    paintHero(session.hero.entity, session.heroForm.color);
  }
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
  const heroId = localStorage.getItem('flight-nemulator-hero-id') ?? '';
  if (!canPickAlignment(heroId)) {
    setPlayerRole('hero');
    window.location.reload();
    return;
  }
  setPlayerRole(role);
  if (heroId === DUAL_ROLE_HERO_ID) {
    localStorage.setItem(
      `flight-nemulator-form-${heroId}`,
      role === 'villain' ? 'doom-villain' : 'doom-hero'
    );
  }
  window.location.reload();
}

export function confirmTerritoryHenchmen(): void {
  if (!session || session.playerRole !== 'villain') return;
  const pos = session.hero.entity.getPosition();
  const did = districtIdAtPosition(pos.x, pos.z);
  if (!did) return;
  applyTerritoryHenchmenChoice(
    session.territory,
    did,
    session.app,
    session.root,
    session.factionNpcs,
    session.heroSpec.id,
    session.wave
  );
}

export function confirmTerritoryRaze(): void {
  if (!session || session.playerRole !== 'villain') return;
  const pos = session.hero.entity.getPosition();
  const did = districtIdAtPosition(pos.x, pos.z);
  if (!did) return;
  applyTerritoryRazeChoice(session.territory, did, session.city);
}

export function requestLanternAidAtSafeHouse(): void {
  if (!session || session.heroSpec.id !== SOLAR_HERO_ID) return;
  const pos = session.hero.entity.getPosition();
  if (!nearLanternSafeHouse(pos) || lanternAidForFinalBoss() || isSolarCorrupted()) return;
  markLanternAid();
  playWaveAlert();
}

export function selectHero(heroId: string, formId?: string): void {
  const prev = localStorage.getItem('flight-nemulator-hero-id');
  localStorage.setItem('flight-nemulator-hero-id', heroId);
  const role = enforceAlignmentForHero(heroId);
  if (heroId === DUAL_ROLE_HERO_ID && role === 'villain' && !formId) {
    formId = 'doom-villain';
  }
  if (heroId === DUAL_ROLE_HERO_ID && role === 'hero' && !formId) {
    formId = 'doom-hero';
  }
  if (formId) localStorage.setItem(`flight-nemulator-form-${heroId}`, formId);

  if (session && prev === heroId && formId) {
    const spec = pickHero();
    session.heroForm = resolveHeroForm(spec, formId);
    session.hero.form = session.heroForm;
    paintHero(session.hero.entity, session.heroForm.color);
    syncFlightAssistVisuals(
      session.app,
      session.hero.entity,
      effectiveHeroAerial(spec, session.heroForm),
      session.heroForm.color
    );
    return;
  }
  window.location.reload();
}
