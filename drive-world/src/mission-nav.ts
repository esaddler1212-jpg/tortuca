import { TACO_TRUCKS } from './city-taco-trucks';
import { LANDMARKS } from './landmark-registry';
import { bayRegionsGated, nextVallejoStep, syncVallejoMissionSteps } from './mission-chapters';
import type { SavedProgress } from './game-progress';

export type ChapterPin = { label: string; hint: string; x: number; z: number };

export function chapterObjectivePin(progress: SavedProgress): ChapterPin | null {
  if (!bayRegionsGated(progress)) return null;
  const step = nextVallejoStep(syncVallejoMissionSteps(progress));
  if (!step) return null;
  const label = step.label;
  const hint = step.hint;

  switch (step.id) {
    case 'v-pick-car':
    case 'v-fuel':
    case 'v-park-estate':
    case 'v-dyno':
      return { label, hint, x: 500, z: 926 };
    case 'v-taco': {
      const taco = TACO_TRUCKS.find((t) => t.district === 'vallejo');
      if (taco) return { label, hint, x: taco.x, z: taco.z };
      return { label, hint, x: 465, z: 955 };
    }
    case 'v-mare': {
      const lm = LANDMARKS.find((l) => l.id === 'mare-island');
      return lm ? { label, hint, x: lm.x, z: lm.z } : null;
    }
    case 'v-carquinez': {
      const lm = LANDMARKS.find((l) => l.id === 'carquinez');
      return lm ? { label, hint, x: lm.x, z: lm.z } : null;
    }
    case 'v-helipad': {
      const lm = LANDMARKS.find((l) => l.id === 'vallejo-helipad');
      return lm ? { label, hint, x: lm.x, z: lm.z } : null;
    }
    case 'v-park-mare':
      return { label, hint, x: 418, z: 1000 };
    case 'v-drag':
      return { label, hint, x: 418, z: 1005 };
    case 'v-drift':
      return { label, hint, x: 465, z: 955 };
    case 'v-time':
      return { label, hint, x: 480, z: 940 };
    case 'v-meet':
      return { label, hint, x: 465, z: 955 };
    case 'v-taxi':
      return { label, hint, x: 500, z: 900 };
    case 'v-unlock':
      return { label, hint, x: 500, z: 900 };
    default:
      return null;
  }
}
