import {
  AppBase,
  Color,
  Entity,
  FILLMODE_FILL_WINDOW,
  RESOLUTION_AUTO,
  Vec3
} from 'playcanvas';
import { buildMetropolis, getDestructibles, nearestDistrictLabel, spawnSimpleCars } from './build-city';
import { attachUnitBox } from './primitive-mesh';
import {
  DEFAULT_HERO_ID,
  getHero,
  type HeroForm,
  type HeroSpec
} from './hero-roster';
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
  type EnemyDrone
} from './combat';
import { isPhotoMode, togglePhotoMode } from './photo-mode';
import { fetchManifestIfOnline } from './updates';
import { loadCustomHeroes, customHeroToSpec } from './custom-hero';

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
};

let session: GameSession | null = null;

function pickHero(): HeroSpec {
  const stored = localStorage.getItem('flight-nemulator-hero-id') ?? DEFAULT_HERO_ID;
  const custom = loadCustomHeroes().find((c) => c.id === stored);
  if (custom) return customHeroToSpec(custom);
  return getHero(stored) ?? getHero(DEFAULT_HERO_ID)!;
}

function resolveForm(spec: HeroSpec): HeroForm {
  const fid = localStorage.getItem(`flight-nemulator-form-${spec.id}`) ?? spec.defaultFormId;
  return spec.forms.find((f) => f.id === fid) ?? spec.forms[0];
}

export async function startGame(app: AppBase, canvas: HTMLCanvasElement): Promise<void> {
  bindFlightKeys();
  void fetchManifestIfOnline();

  const tier = detectQualityTier();
  const heroSpec = pickHero();
  const heroForm = resolveForm(heroSpec);
  const spawn = spawnAtHome(heroSpec.districtId);

  const root = new Entity('world-root');
  app.root.addChild(root);

  buildMetropolis(app, root);
  spawnSimpleCars(app, root, tier === 'low' ? 40 : 120);

  const flight = new HeroFlightController(heroSpec, heroForm, spawn);
  const [r, g, b] = heroForm.color;
  flight.entity.addComponent('render', {
    meshInstances: [attachUnitBox(app, r, g, b)]
  });
  flight.entity.setLocalScale(1.8, 3.2, 1.2);
  root.addChild(flight.entity);

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
    waveCooldown: 8,
    camera
  };

  app.on('update', (dt: number) => {
    if (!session) return;
    tickFrame(session, dt, canvas);
  });

  app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(RESOLUTION_AUTO);
  app.start();
}

function tickFrame(s: GameSession, dt: number, canvas: HTMLCanvasElement): void {
  const input = pollFlightInput();
  if (input.photo) togglePhotoMode();

  s.hero.update(dt, input);
  const pos = s.hero.entity.getPosition();
  const tags = getDestructibles();

  const smash = checkHeroSmash(s.app, s.root, pos, s.hero.speedKmh(), s.heroSpec.smashRadius, tags, s.tier);
  if (smash.costUsd > 0) {
    s.destructionUsd += smash.costUsd;
    addDestructionHeat(s.wanted, smash.costUsd, dt);
  }

  if (input.primary && s.hero.canPrimary()) {
    s.hero.triggerPrimary();
    firePrimary(s.heroSpec, pos, s.hero.aimPoint(), s.drones);
  }
  if (input.throw) {
    throwProp(tags, pos, s.drones);
  }
  if (input.super && s.hero.canSuper()) {
    s.hero.triggerSuper();
    const aim = s.hero.aimPoint(120);
    const blast = superCrater(s.app, s.root, aim, tags, s.tier, 45);
    s.destructionUsd += blast.costUsd;
    addDestructionHeat(s.wanted, blast.costUsd, dt);
  }

  s.waveCooldown -= dt;
  if (s.waveCooldown <= 0 && s.drones.length < 6) {
    s.wave += 1;
    s.waveCooldown = Math.max(6, 14 - s.wave * 0.5);
    const batch = spawnWaveDrones(s.app, s.root, pos, 3 + Math.min(8, s.wave));
    batch.forEach((d) => {
      d.entity.addComponent('render', {
        meshInstances: [attachUnitBox(s.app, 0.85, 0.2, 0.15)]
      });
      d.entity.setLocalScale(3.5, 1.2, 3.5);
    });
    s.drones.push(...batch);
  }
  tickDrones(s.drones, pos, dt, s.root);

  tickDebris(dt, s.root);

  const f = s.hero.forward();
  const camPos = new Vec3(pos.x - f.x * 14, pos.y + 5, pos.z - f.z * 14);
  s.camera.setPosition(camPos);
  s.camera.lookAt(pos);

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
    photoMode: isPhotoMode()
  });
}

export function selectHero(heroId: string, formId?: string): void {
  localStorage.setItem('flight-nemulator-hero-id', heroId);
  if (formId) localStorage.setItem(`flight-nemulator-form-${heroId}`, formId);
  window.location.reload();
}
