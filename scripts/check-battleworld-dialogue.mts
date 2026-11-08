import {
  dialogueFoeDefeat,
  dialogueIntro,
  dialoguePairVictory,
  dialogueSafeHouse
} from '../flight-nemulator/src/battleworld-dialogue.ts';
import {
  buildBattleworldAutosave,
  loadBattleworldAutosave,
  AUTOSAVE_VERSION
} from '../flight-nemulator/src/battleworld-autosave.ts';
import { cutsceneHudFields, queueDialogue, acknowledgeDialogue, clearDialogueQueue } from '../flight-nemulator/src/cutscene-queue.ts';
import { FOOT_BOOSTER_HERO_IDS } from '../flight-nemulator/src/aerial-mobility.ts';
import { getHero } from '../flight-nemulator/src/hero-roster.ts';

const intro = dialogueIntro('Solar Apex', 'hero');
if (intro.length < 2) {
  console.error('intro dialogue too short');
  process.exit(1);
}

const defeat = dialogueFoeDefeat('Solar Apex', 'hero', 'titan-snap-echo', 'Titan Snap Echo');
if (!defeat.some((l) => l.speaker.includes('Titan'))) {
  console.error('defeat dialogue missing foe');
  process.exit(1);
}

const save = buildBattleworldAutosave({
  heroId: 'solar-apex',
  playerRole: 'hero',
  wave: 3,
  waveCooldown: 10,
  destructionUsd: 0,
  foesStopped: 2,
  wantedStars: 1,
  cityIntegrityPct: 98,
  pairBossSpawned: false,
  pairBossDefeated: false,
  pairBossWarned: false,
  position: { x: 0, y: 80, z: 0 },
  lastDefeat: { profileId: 'generic', codename: 'Raider' },
  sessionStats: {
    destructionUsd: 0,
    wavesCleared: 0,
    dronesDestroyed: 2,
    supersUsed: 0,
    updatedAt: new Date().toISOString()
  }
});
if (save.version !== AUTOSAVE_VERSION) {
  console.error('autosave version');
  process.exit(1);
}

clearDialogueQueue();
queueDialogue(dialoguePairVictory('Solar Apex', 'Titan Snap Echo'));
queueDialogue(dialogueSafeHouse('Solar Apex', 'Lantern vault'));
const first = cutsceneHudFields();
if (!first.cutsceneActive) {
  console.error('cutscene queue did not surface');
  process.exit(1);
}
acknowledgeDialogue();
const second = cutsceneHudFields();
if (!second.cutsceneActive) {
  console.error('cutscene queue did not advance');
  process.exit(1);
}

void loadBattleworldAutosave;

for (const id of FOOT_BOOSTER_HERO_IDS) {
  const h = getHero(id);
  if (!h || h.aerial !== 'foot-boost') {
    console.error(`foot-boost hero misconfigured: ${id}`);
    process.exit(1);
  }
}

console.log('check-battleworld-dialogue: ok');
